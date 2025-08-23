package com.auto.postings.controller;

import com.auto.postings.dto.RatingRequestDTO;
import com.auto.postings.dto.RatingResponseDTO;
import com.auto.postings.dto.TechnicianRatingSummaryDTO;
import com.auto.postings.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RatingController {
    
    private final RatingService ratingService;
    
    /**
     * Create a new rating
     */
    @PostMapping
    public ResponseEntity<?> createRating(@Valid @RequestBody RatingRequestDTO request) {
        try {
            log.info("Creating rating for post: {}", request.getPostId());
            RatingResponseDTO response = ratingService.createRating(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating rating: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error creating rating: " + e.getMessage());
        }
    }
    
    /**
     * Update an existing rating
     */
    @PutMapping("/{ratingId}")
    public ResponseEntity<?> updateRating(@PathVariable Long ratingId, 
                                         @Valid @RequestBody RatingRequestDTO request) {
        try {
            log.info("Updating rating with ID: {}", ratingId);
            RatingResponseDTO response = ratingService.updateRating(ratingId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating rating: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error updating rating: " + e.getMessage());
        }
    }
    
    /**
     * Get rating by post ID
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<?> getRatingByPostId(@PathVariable Long postId) {
        try {
            Optional<RatingResponseDTO> rating = ratingService.getRatingByPostId(postId);
            if (rating.isPresent()) {
                return ResponseEntity.ok(rating.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching rating for post {}: {}", postId, e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching rating: " + e.getMessage());
        }
    }
    
    /**
     * Get all ratings for a technician
     */
    @GetMapping("/technician/{technicianEmail}")
    public ResponseEntity<?> getRatingsByTechnician(@PathVariable String technicianEmail,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        try {
            if (size > 0) {
                Page<RatingResponseDTO> ratings = ratingService.getRatingsByTechnician(technicianEmail, page, size);
                return ResponseEntity.ok(ratings);
            } else {
                List<RatingResponseDTO> ratings = ratingService.getRatingsByTechnician(technicianEmail);
                return ResponseEntity.ok(ratings);
            }
        } catch (Exception e) {
            log.error("Error fetching ratings for technician {}: {}", technicianEmail, e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching ratings: " + e.getMessage());
        }
    }
    
    /**
     * Get all ratings by a dealer
     */
    @GetMapping("/dealer/{dealerEmail}")
    public ResponseEntity<?> getRatingsByDealer(@PathVariable String dealerEmail) {
        try {
            List<RatingResponseDTO> ratings = ratingService.getRatingsByDealer(dealerEmail);
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            log.error("Error fetching ratings for dealer {}: {}", dealerEmail, e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching ratings: " + e.getMessage());
        }
    }
    
    /**
     * Get technician rating summary
     */
    @GetMapping("/technician/{technicianEmail}/summary")
    public ResponseEntity<?> getTechnicianRatingSummary(@PathVariable String technicianEmail) {
        try {
            TechnicianRatingSummaryDTO summary = ratingService.getTechnicianRatingSummary(technicianEmail);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error fetching rating summary for technician {}: {}", technicianEmail, e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching rating summary: " + e.getMessage());
        }
    }
    
    /**
     * Get top rated technicians
     */
    @GetMapping("/top-rated")
    public ResponseEntity<?> getTopRatedTechnicians(@RequestParam(defaultValue = "5") int minRatings,
                                                   @RequestParam(defaultValue = "10") int limit) {
        try {
            List<TechnicianRatingSummaryDTO> topRated = ratingService.getTopRatedTechnicians(minRatings, limit);
            return ResponseEntity.ok(topRated);
        } catch (Exception e) {
            log.error("Error fetching top rated technicians: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching top rated technicians: " + e.getMessage());
        }
    }
    
    /**
     * Get technicians needing improvement
     */
    @GetMapping("/needing-improvement")
    public ResponseEntity<?> getTechniciansNeedingImprovement(@RequestParam(defaultValue = "3") int minRatings) {
        try {
            List<TechnicianRatingSummaryDTO> needingImprovement = ratingService.getTechniciansNeedingImprovement(minRatings);
            return ResponseEntity.ok(needingImprovement);
        } catch (Exception e) {
            log.error("Error fetching technicians needing improvement: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching technicians needing improvement: " + e.getMessage());
        }
    }
    
    /**
     * Get technicians eligible for premium jobs
     */
    @GetMapping("/premium-eligible")
    public ResponseEntity<?> getTechniciansEligibleForPremiumJobs() {
        try {
            List<TechnicianRatingSummaryDTO> eligible = ratingService.getTechniciansEligibleForPremiumJobs();
            return ResponseEntity.ok(eligible);
        } catch (Exception e) {
            log.error("Error fetching premium eligible technicians: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching premium eligible technicians: " + e.getMessage());
        }
    }
    
    /**
     * Check if technician is eligible for a job
     */
    @GetMapping("/technician/{technicianEmail}/eligibility")
    public ResponseEntity<?> checkTechnicianEligibility(@PathVariable String technicianEmail,
                                                       @RequestParam(defaultValue = "false") boolean isPremiumJob) {
        try {
            boolean eligible = ratingService.isTechnicianEligibleForJob(technicianEmail, isPremiumJob);
            double multiplier = ratingService.getRatingMultiplier(technicianEmail);
            
            return ResponseEntity.ok(new EligibilityResponse(eligible, multiplier));
        } catch (Exception e) {
            log.error("Error checking technician eligibility: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error checking eligibility: " + e.getMessage());
        }
    }
    
    /**
     * Get recent ratings (for admin dashboard)
     */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentRatings(@RequestParam(defaultValue = "20") int limit) {
        try {
            List<RatingResponseDTO> recentRatings = ratingService.getRecentRatings(limit);
            return ResponseEntity.ok(recentRatings);
        } catch (Exception e) {
            log.error("Error fetching recent ratings: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching recent ratings: " + e.getMessage());
        }
    }
    
    /**
     * Get low ratings that need attention (for admin)
     */
    @GetMapping("/low-ratings")
    public ResponseEntity<?> getLowRatings(@RequestParam(defaultValue = "2") int maxRating,
                                          @RequestParam(defaultValue = "20") int limit) {
        try {
            List<RatingResponseDTO> lowRatings = ratingService.getLowRatings(maxRating, limit);
            return ResponseEntity.ok(lowRatings);
        } catch (Exception e) {
            log.error("Error fetching low ratings: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching low ratings: " + e.getMessage());
        }
    }
    
    /**
     * Get all ratings with pagination (admin only)
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllRatings(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        try {
            Page<RatingResponseDTO> ratings = ratingService.getAllRatings(page, size);
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            log.error("Error fetching all ratings: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching ratings: " + e.getMessage());
        }
    }
    
    /**
     * Delete a rating (admin only)
     */
    @DeleteMapping("/admin/{ratingId}")
    public ResponseEntity<?> deleteRating(@PathVariable Long ratingId) {
        try {
            ratingService.deleteRating(ratingId);
            return ResponseEntity.ok("Rating deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting rating: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error deleting rating: " + e.getMessage());
        }
    }
    
    // Helper classes
    public static class EligibilityResponse {
        private boolean eligible;
        private double ratingMultiplier;
        
        public EligibilityResponse(boolean eligible, double ratingMultiplier) {
            this.eligible = eligible;
            this.ratingMultiplier = ratingMultiplier;
        }
        
        public boolean isEligible() {
            return eligible;
        }
        
        public double getRatingMultiplier() {
            return ratingMultiplier;
        }
    }
}
