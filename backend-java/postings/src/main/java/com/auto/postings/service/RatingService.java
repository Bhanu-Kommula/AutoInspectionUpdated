package com.auto.postings.service;

import com.auto.postings.dto.RatingRequestDTO;
import com.auto.postings.dto.RatingResponseDTO;
import com.auto.postings.dto.TechnicianRatingSummaryDTO;
import com.auto.postings.model.Posting;
import com.auto.postings.model.PostStatus;
import com.auto.postings.model.Rating;
import com.auto.postings.model.TechnicianRatingSummary;
import com.auto.postings.repository.PostingRepository;
import com.auto.postings.repository.RatingRepository;
import com.auto.postings.repository.TechnicianRatingSummaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RatingService {
    
    private final RatingRepository ratingRepository;
    private final TechnicianRatingSummaryRepository summaryRepository;
    private final PostingRepository postingRepository;
    
    /**
     * Create a new rating for a completed job
     */
    public RatingResponseDTO createRating(RatingRequestDTO request) {
        log.info("Creating rating for post: {}, technician: {}", request.getPostId(), request.getTechnicianEmail());
        
        // Validate post exists and is completed
        Optional<Posting> postOpt = postingRepository.findById(request.getPostId());
        if (postOpt.isEmpty()) {
            throw new RuntimeException("Post not found with ID: " + request.getPostId());
        }
        
        Posting post = postOpt.get();
        
        // Check if post is completed
        if (post.getStatus() != PostStatus.COMPLETED) {
            throw new RuntimeException("Cannot rate a job that is not completed. Current status: " + post.getStatus());
        }
        
        // Check if dealer is authorized to rate this post
        if (!post.getEmail().equals(request.getDealerEmail())) {
            throw new RuntimeException("Dealer is not authorized to rate this job");
        }
        
        // Check if technician matches
        if (!post.getTechnicianEmail().equals(request.getTechnicianEmail())) {
            throw new RuntimeException("Technician email does not match the job assignment");
        }
        
        // Check if rating already exists
        if (ratingRepository.existsByPostId(request.getPostId())) {
            throw new RuntimeException("Rating already exists for this job");
        }
        
        // Create rating
        Rating rating = new Rating();
        rating.setPostId(request.getPostId());
        rating.setDealerEmail(request.getDealerEmail());
        rating.setTechnicianEmail(request.getTechnicianEmail());
        rating.setRating(request.getRating());
        rating.setReviewComment(request.getReviewComment());
        
        Rating savedRating = ratingRepository.save(rating);
        log.info("Rating created successfully with ID: {}", savedRating.getId());
        
        return convertToResponseDTO(savedRating);
    }
    
    /**
     * Update an existing rating
     */
    public RatingResponseDTO updateRating(Long ratingId, RatingRequestDTO request) {
        log.info("Updating rating with ID: {}", ratingId);
        
        Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
        if (ratingOpt.isEmpty()) {
            throw new RuntimeException("Rating not found with ID: " + ratingId);
        }
        
        Rating rating = ratingOpt.get();
        
        // Verify dealer authorization
        if (!rating.getDealerEmail().equals(request.getDealerEmail())) {
            throw new RuntimeException("Dealer is not authorized to update this rating");
        }
        
        // Update rating
        rating.setRating(request.getRating());
        rating.setReviewComment(request.getReviewComment());
        
        Rating updatedRating = ratingRepository.save(rating);
        log.info("Rating updated successfully");
        
        return convertToResponseDTO(updatedRating);
    }
    
    /**
     * Get rating by post ID
     */
    @Transactional(readOnly = true)
    public Optional<RatingResponseDTO> getRatingByPostId(Long postId) {
        return ratingRepository.findByPostId(postId)
                .map(this::convertToResponseDTO);
    }
    
    /**
     * Get all ratings for a technician
     */
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getRatingsByTechnician(String technicianEmail) {
        return ratingRepository.findByTechnicianEmailOrderByCreatedAtDesc(technicianEmail)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get paginated ratings for a technician
     */
    @Transactional(readOnly = true)
    public Page<RatingResponseDTO> getRatingsByTechnician(String technicianEmail, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ratingRepository.findByTechnicianEmailOrderByCreatedAtDesc(technicianEmail, pageable)
                .map(this::convertToResponseDTO);
    }
    
    /**
     * Get all ratings by a dealer
     */
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getRatingsByDealer(String dealerEmail) {
        return ratingRepository.findByDealerEmailOrderByCreatedAtDesc(dealerEmail)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get technician rating summary
     */
    @Transactional(readOnly = true)
    public TechnicianRatingSummaryDTO getTechnicianRatingSummary(String technicianEmail) {
        Optional<TechnicianRatingSummary> summaryOpt = summaryRepository.findByTechnicianEmail(technicianEmail);
        
        if (summaryOpt.isPresent()) {
            return convertToSummaryDTO(summaryOpt.get());
        } else {
            // Create empty summary if none exists
            TechnicianRatingSummaryDTO dto = new TechnicianRatingSummaryDTO();
            dto.setTechnicianEmail(technicianEmail);
            dto.setTotalRatings(0);
            dto.setAverageRating(BigDecimal.ZERO);
            dto.setRatingQuality("No Ratings");
            dto.setEligibleForPremiumJobs(false);
            dto.setNeedsImprovement(false);
            dto.setRatingPercentage(0.0);
            return dto;
        }
    }
    
    /**
     * Get top rated technicians
     */
    @Transactional(readOnly = true)
    public List<TechnicianRatingSummaryDTO> getTopRatedTechnicians(int minRatings, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return summaryRepository.findTopRated(minRatings, pageable)
                .stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get technicians needing improvement
     */
    @Transactional(readOnly = true)
    public List<TechnicianRatingSummaryDTO> getTechniciansNeedingImprovement(int minRatings) {
        BigDecimal maxRating = BigDecimal.valueOf(3.0);
        return summaryRepository.findNeedingImprovement(maxRating, minRatings)
                .stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get technicians eligible for premium jobs
     */
    @Transactional(readOnly = true)
    public List<TechnicianRatingSummaryDTO> getTechniciansEligibleForPremiumJobs() {
        BigDecimal minRating = BigDecimal.valueOf(4.0);
        Integer minRatings = 5;
        return summaryRepository.findEligibleForPremiumJobs(minRating, minRatings)
                .stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all ratings with pagination (for admin)
     */
    @Transactional(readOnly = true)
    public Page<RatingResponseDTO> getAllRatings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ratingRepository.findAll(pageable)
                .map(this::convertToResponseDTO);
    }
    
    /**
     * Get recent ratings
     */
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getRecentRatings(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return ratingRepository.findRecentRatings(pageable)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get low ratings that need attention
     */
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getLowRatings(int maxRating, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return ratingRepository.findLowRatings(maxRating, pageable)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a rating (admin only)
     */
    public void deleteRating(Long ratingId) {
        log.info("Deleting rating with ID: {}", ratingId);
        
        if (!ratingRepository.existsById(ratingId)) {
            throw new RuntimeException("Rating not found with ID: " + ratingId);
        }
        
        ratingRepository.deleteById(ratingId);
        log.info("Rating deleted successfully");
    }
    
    /**
     * Check if technician is eligible for job based on rating
     */
    @Transactional(readOnly = true)
    public boolean isTechnicianEligibleForJob(String technicianEmail, boolean isPremiumJob) {
        Optional<TechnicianRatingSummary> summaryOpt = summaryRepository.findByTechnicianEmail(technicianEmail);
        
        if (summaryOpt.isEmpty()) {
            // New technicians are eligible for regular jobs but not premium jobs
            return !isPremiumJob;
        }
        
        TechnicianRatingSummary summary = summaryOpt.get();
        
        // If it's a premium job, check premium eligibility
        if (isPremiumJob) {
            return summary.isEligibleForPremiumJobs();
        }
        
        // For regular jobs, check if technician doesn't need improvement
        // or has less than 3 ratings (benefit of doubt for new technicians)
        return summary.getTotalRatings() < 3 || !summary.needsImprovement();
    }
    
    /**
     * Get rating filter multiplier for job visibility
     * Higher rating = higher visibility multiplier
     */
    @Transactional(readOnly = true)
    public double getRatingMultiplier(String technicianEmail) {
        Optional<TechnicianRatingSummary> summaryOpt = summaryRepository.findByTechnicianEmail(technicianEmail);
        
        if (summaryOpt.isEmpty()) {
            return 1.0; // Neutral for new technicians
        }
        
        TechnicianRatingSummary summary = summaryOpt.get();
        BigDecimal avgRating = summary.getAverageRating();
        
        if (avgRating.compareTo(BigDecimal.valueOf(4.5)) >= 0) {
            return 1.5; // 50% boost for excellent ratings
        } else if (avgRating.compareTo(BigDecimal.valueOf(4.0)) >= 0) {
            return 1.2; // 20% boost for very good ratings
        } else if (avgRating.compareTo(BigDecimal.valueOf(3.5)) >= 0) {
            return 1.0; // Neutral for good ratings
        } else if (avgRating.compareTo(BigDecimal.valueOf(3.0)) >= 0) {
            return 0.8; // 20% reduction for average ratings
        } else {
            return 0.5; // 50% reduction for poor ratings
        }
    }
    
    // Helper methods
    private RatingResponseDTO convertToResponseDTO(Rating rating) {
        RatingResponseDTO dto = new RatingResponseDTO();
        dto.setId(rating.getId());
        dto.setPostId(rating.getPostId());
        dto.setDealerEmail(rating.getDealerEmail());
        dto.setTechnicianEmail(rating.getTechnicianEmail());
        dto.setRating(rating.getRating());
        dto.setReviewComment(rating.getReviewComment());
        dto.setCreatedAt(rating.getCreatedAt());
        dto.setUpdatedAt(rating.getUpdatedAt());
        
        // Fetch additional details from posting
        Optional<Posting> postOpt = postingRepository.findById(rating.getPostId());
        if (postOpt.isPresent()) {
            Posting post = postOpt.get();
            dto.setDealerName(post.getName());
            dto.setTechnicianName(post.getTechnicianName());
            dto.setPostTitle(post.getContent());
            dto.setPostLocation(post.getLocation());
        }
        
        return dto;
    }
    
    private TechnicianRatingSummaryDTO convertToSummaryDTO(TechnicianRatingSummary summary) {
        TechnicianRatingSummaryDTO dto = new TechnicianRatingSummaryDTO();
        dto.setId(summary.getId());
        dto.setTechnicianEmail(summary.getTechnicianEmail());
        dto.setTotalRatings(summary.getTotalRatings());
        dto.setAverageRating(summary.getAverageRating());
        dto.setFiveStarCount(summary.getFiveStarCount());
        dto.setFourStarCount(summary.getFourStarCount());
        dto.setThreeStarCount(summary.getThreeStarCount());
        dto.setTwoStarCount(summary.getTwoStarCount());
        dto.setOneStarCount(summary.getOneStarCount());
        dto.setLastRatedAt(summary.getLastRatedAt());
        dto.setCreatedAt(summary.getCreatedAt());
        dto.setUpdatedAt(summary.getUpdatedAt());
        
        // Computed fields
        dto.setRatingQuality(summary.getRatingQuality());
        dto.setEligibleForPremiumJobs(summary.isEligibleForPremiumJobs());
        dto.setNeedsImprovement(summary.needsImprovement());
        
        // Calculate percentages
        if (summary.getTotalRatings() > 0) {
            dto.setRatingPercentage(summary.getAverageRating().multiply(BigDecimal.valueOf(20)).doubleValue());
            
            double total = summary.getTotalRatings().doubleValue();
            dto.setFiveStarPercentage((summary.getFiveStarCount() / total) * 100);
            dto.setFourStarPercentage((summary.getFourStarCount() / total) * 100);
            dto.setThreeStarPercentage((summary.getThreeStarCount() / total) * 100);
            dto.setTwoStarPercentage((summary.getTwoStarCount() / total) * 100);
            dto.setOneStarPercentage((summary.getOneStarCount() / total) * 100);
        } else {
            dto.setRatingPercentage(0.0);
            dto.setFiveStarPercentage(0.0);
            dto.setFourStarPercentage(0.0);
            dto.setThreeStarPercentage(0.0);
            dto.setTwoStarPercentage(0.0);
            dto.setOneStarPercentage(0.0);
        }
        
        return dto;
    }
}
