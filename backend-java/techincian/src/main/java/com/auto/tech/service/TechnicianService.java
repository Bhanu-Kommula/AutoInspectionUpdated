package com.auto.tech.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auto.tech.client.PostingClient;
import com.auto.tech.client.TechDashboardFeignClient;
import com.auto.tech.configuration.WebSocketDealerNotifier;
import com.auto.tech.dto.FeignEmailRequestDto;
import com.auto.tech.dto.GetTechAccpetedPostsByEmailDto;
import com.auto.tech.dto.PostingDTO;
import com.auto.tech.dto.TechInfoToGetPostsByLocationDto;
import com.auto.tech.dto.UpdateTechnicianDto;
import com.auto.tech.dto.PostStatusUpdateRequest;
import com.auto.tech.model.TechAcceptedPost;
import com.auto.tech.model.TechDeclinedPosts;
import com.auto.tech.model.Technician;
import com.auto.tech.model.TechnicianAuditLog;
import com.auto.tech.model.WebSocketPostNotifier;
import com.auto.tech.repository.AcceptedPostRepository;
import com.auto.tech.repository.DeclinedPostsRepository;
import com.auto.tech.repository.TechnicianAuditLogRepository;
import com.auto.tech.repository.TechnicianRepository;
import com.auto.tech.service.CounterOfferService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TechnicianService {

	private final TechnicianRepository repo;
	private final PostingClient postingClient;
	private final DeclinedPostsRepository declinedPostsRepo;
	private final AcceptedPostRepository acceptedPostRepo;
	private final WebSocketDealerNotifier dealerNotifier;
	private final TechnicianAuditLogRepository auditRepo;
	private final WebSocketPostNotifier postNotifier;
	private final TechDashboardFeignClient techDashboardClient;
	private final CounterOfferService counterOfferService;
	
	
	public String capitalizeEachWord(String str) {
		if (str == null || str.isEmpty()) return str;
		return java.util.Arrays.stream(str.split("\\s+"))
			.map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
			.collect(Collectors.joining(" "));
	}
	
	public Technician register(Technician technician) {
		try {
			log.info("🔍 [TechnicianService] Attempting registration for email: {}", technician.getEmail());
			
			// Validate required fields
			if (technician.getName() == null || technician.getName().trim().isEmpty()) {
				throw new IllegalArgumentException("Name is required");
			}
			if (technician.getEmail() == null || technician.getEmail().trim().isEmpty()) {
				throw new IllegalArgumentException("Email is required");
			}
			if (technician.getPhone() == null || technician.getPhone().trim().isEmpty()) {
				throw new IllegalArgumentException("Phone is required");
			}
			if (technician.getPassword() == null || technician.getPassword().trim().isEmpty()) {
				throw new IllegalArgumentException("Password is required");
			}
			if (technician.getLocation() == null || technician.getLocation().trim().isEmpty()) {
				throw new IllegalArgumentException("Location is required");
			}
			if (technician.getZipcode() == null || technician.getZipcode().trim().isEmpty()) {
				throw new IllegalArgumentException("Zipcode is required");
			}
			if (technician.getYearsOfExperience() == null || technician.getYearsOfExperience().trim().isEmpty()) {
				throw new IllegalArgumentException("Years of experience is required");
			}
			
			// Check if email already exists
			Optional<Technician> existingTech = repo.findByEmailIgnoreCase(technician.getEmail().trim());
			if (existingTech.isPresent()) {
				log.warn("❌ [TechnicianService] Email already exists: {}", technician.getEmail());
				throw new IllegalArgumentException("Email already exists. Please try to login instead.");
			}
			
			// Process the data
			technician.setName(capitalizeEachWord(technician.getName()));
			technician.setEmail(technician.getEmail().trim().toLowerCase());
			
			// Set default status if not provided
			if (technician.getStatus() == null || technician.getStatus().trim().isEmpty()) {
				technician.setStatus("ACTIVE");
			}
			
			Technician saved = repo.save(technician);
			log.info("✅ [TechnicianService] Registration successful for technician: {} (ID: {})", 
				saved.getName(), saved.getId());
			
			return saved;
		} catch (Exception e) {
			log.error("💥 [TechnicianService] Database error during registration for email {}: {}", 
				technician.getEmail(), e.getMessage(), e);
			throw e; // Re-throw to be handled by controller
		}
	}
	

	public ResponseEntity<?> login(String email) {
		try {
			log.info("🔍 [TechnicianService] Attempting login for email: {}", email);
			
			if (email == null || email.trim().isEmpty()) {
				log.warn("❌ [TechnicianService] Empty email provided for login");
				Map<String, String> error = new HashMap<>();
				error.put("error", "Email is required");
				return ResponseEntity.status(400).body(error);
			}
			
			Optional<Technician> technicianOpt = repo.findByEmailIgnoreCase(email.trim());
			log.info("🔍 [TechnicianService] Database query completed. Found: {}", technicianOpt.isPresent());
			
			if (technicianOpt.isPresent()) {
				Technician technician = technicianOpt.get();
				log.info("✅ [TechnicianService] Login successful for technician: {} (ID: {})", technician.getName(), technician.getId());
				return ResponseEntity.ok(technician);
			} else {
				log.warn("❌ [TechnicianService] No technician found with email: {}", email);
				Map<String, String> error = new HashMap<>();
				error.put("error", "User not found. Please check your email.");
				return ResponseEntity.status(401).body(error);
			}
		} catch (Exception e) {
			log.error("💥 [TechnicianService] Database error during login for email {}: {}", email, e.getMessage(), e);
			Map<String, String> error = new HashMap<>();
			error.put("error", "Database connection error. Please try again.");
			error.put("details", e.getMessage());
			return ResponseEntity.status(500).body(error);
		}
	}

	public List<PostingDTO> fetchAllPostings(TechInfoToGetPostsByLocationDto dto) {
	    Technician technician = repo.findByEmailIgnoreCase(dto.getEmail())
	            .orElseThrow(() -> new RuntimeException("Technician not found"));

	    String technicianLocation = technician.getLocation().trim(); // e.g., "Dallas, Texas"

	    List<Long> declinedPostIds = declinedPostsRepo.findAllPostIdsByEmail(dto.getEmail());
	    List<Long> acceptedPostIds = acceptedPostRepo.findAllAcceptedPostIds();

	    List<PostingDTO> allPostings = postingClient.getAllPostings();

	    return allPostings.stream()
	            .filter(post -> {
	                String postLocation = post.getLocation();
	                return postLocation != null
	                        && postLocation.trim().equalsIgnoreCase(technicianLocation)
	                        && !declinedPostIds.contains(post.getId())
	                        && (!acceptedPostIds.contains(post.getId())
	                            || acceptedPostRepo.existsByPostIdAndEmailIgnoreCase(post.getId(), dto.getEmail()));
	            })
	            .collect(Collectors.toList());
	}

	public void declinedPosts(TechDeclinedPosts declinedPosts) {
	    System.out.println("🔄 Processing declined post: postId=" + declinedPosts.getPostId() + 
	                     ", technicianEmail=" + declinedPosts.getEmail());
	    
	    // ✅ Withdraw any pending counter offers for this post by this technician
	    try {
	        counterOfferService.withdrawCounterOffersForPost(declinedPosts.getPostId(), declinedPosts.getEmail());
	        System.out.println("✅ Withdrawn counter offers for declined post: " + declinedPosts.getPostId());
	    } catch (Exception e) {
	        System.err.println("❌ Failed to withdraw counter offers: " + e.getMessage());
	        // Don't fail the entire operation if counter offer withdrawal fails
	    }
	    
	    // Save to declined posts table
	    TechDeclinedPosts saved = declinedPostsRepo.save(declinedPosts);
	    System.out.println("✅ Saved declined post to database: postId=" + saved.getPostId() + 
	                     ", technicianEmail=" + saved.getEmail() + ", id=" + saved.getId());
	}

	
	// ✅ WORKING LOCAL IMPLEMENTATION - Restored for Render deployment
	@Transactional
	public void techAcceptedPosts(TechAcceptedPost acceptedPost) {
	    try {
	        System.out.println("🔄 Processing technician post acceptance: postId=" + acceptedPost.getPostId() + 
	                         ", technicianEmail=" + acceptedPost.getEmail());
	        
	        // RACE CONDITION PROTECTION: Check without locking (Render PostgreSQL compatibility)
	        if (acceptedPostRepo.existsByPostId(acceptedPost.getPostId())) {
	            String errorMsg = "This post has already been accepted by another technician";
	            System.err.println("❌ " + errorMsg);
	            throw new IllegalStateException(errorMsg);
	        }

	        // ✅ Step 1: Withdraw any pending counter offers for this post by this technician
	        try {
	            counterOfferService.withdrawCounterOffersForPost(acceptedPost.getPostId(), acceptedPost.getEmail());
	            System.out.println("✅ Withdrawn pending counter offers for post " + acceptedPost.getPostId());
	        } catch (Exception e) {
	            System.err.println("❌ Failed to withdraw counter offers: " + e.getMessage());
	            // Don't fail the entire operation if counter offer withdrawal fails
	        }

	        // ✅ Step 2: Save to tech_accepted_post table (Render database)
	        acceptedPost.setAcceptedAt(LocalDateTime.now());
	        try {
	            acceptedPostRepo.save(acceptedPost);
	            System.out.println("✅ Saved to technician tech_accepted_post table: postId=" + acceptedPost.getPostId());
	        } catch (org.springframework.dao.DataIntegrityViolationException e) {
	            System.err.println("❌ Post already accepted by another technician (database constraint): " + e.getMessage());
	            throw new IllegalStateException("This post has already been accepted by another technician");
	        } catch (Exception e) {
	            System.err.println("❌ Database error saving accepted post: " + e.getMessage());
	            throw new RuntimeException("Failed to save post acceptance: " + e.getMessage(), e);
	        }

	        // ✅ Step 3: Update post status to ACCEPTED in posts service (Render URLs)
	        try {
	            // Get technician details for the update
	            Optional<Technician> technicianOpt = repo.findByEmailIgnoreCase(acceptedPost.getEmail());
	            if (technicianOpt.isPresent()) {
	                Technician technician = technicianOpt.get();
	                
	                // Use posting service via Feign client (already configured for Render service discovery)
	                PostStatusUpdateRequest updateRequest = new PostStatusUpdateRequest();
	                updateRequest.setId(acceptedPost.getPostId());
	                updateRequest.setStatus("ACCEPTED");
	                updateRequest.setTechnicianName(technician.getName());
	                updateRequest.setTechnicianEmail(technician.getEmail());
	                
	                String updateResult = postingClient.updatePostStatus(updateRequest);
	                System.out.println("✅ Post status updated to ACCEPTED: " + updateResult);
	                
	            } else {
	                System.err.println("❌ Technician not found for email: " + acceptedPost.getEmail());
	            }
	        } catch (Exception e) {
	            System.err.println("❌ Failed to update post status: " + e.getMessage());
	            // Don't fail the entire operation if status update fails
	        }

	        // ✅ Step 4: Notify other technicians to remove the post
	        try {
	            postNotifier.notifyPostAccepted(acceptedPost.getPostId());
	            System.out.println("✅ Notified other technicians about post acceptance");
	        } catch (Exception e) {
	            System.err.println("❌ Failed to notify other technicians: " + e.getMessage());
	        }

	        // ✅ Step 5: Update tech dashboard (Render service discovery)
	        try {
	            FeignEmailRequestDto dto = new FeignEmailRequestDto();
	            dto.setEmail(acceptedPost.getEmail());

	            techDashboardClient.processAndUpdateAcceptedPosts(dto);
	            System.out.println("✅ Updated tech dashboard for technician " + acceptedPost.getEmail());

	            // ✅ Get the updated post and push to dealer immediately
	            PostingDTO updatedPost = postingClient.getPostById(acceptedPost.getPostId());
	            dealerNotifier.notifyDealerPostUpdated(updatedPost);
	            System.out.println("✅ Notified dealer about post acceptance");

	        } catch (Exception e) {
	            System.err.println("❌ Dealer update via Feign failed: " + e.getMessage());
	        }
	        
	        System.out.println("✅ Successfully processed technician post acceptance for post " + acceptedPost.getPostId());
	        
	    } catch (IllegalStateException e) {
	        // Re-throw validation errors
	        throw e;
	    } catch (Exception e) {
	        System.err.println("❌ Unexpected error processing technician post acceptance: " + e.getMessage());
	        throw new RuntimeException("Failed to process technician post acceptance: " + e.getMessage(), e);
	    }
	}
	
	
	public List<PostingDTO> getFilteredFeed(TechInfoToGetPostsByLocationDto dto) {
	    Technician technician = repo.findByEmailIgnoreCase(dto.getEmail())
	            .orElseThrow(() -> new RuntimeException("Technician not found"));

	    String technicianLocation = technician.getLocation().trim();

	    List<Long> declinedPostIds = declinedPostsRepo.findAllPostIdsByEmail(dto.getEmail());
	    List<Long> acceptedPostIds = acceptedPostRepo.findAllAcceptedPostIds();

	    System.out.println("🔍 Filtering feed for technician: " + dto.getEmail());
	    System.out.println("🔍 Technician location: " + technicianLocation);
	    System.out.println("🔍 Declined post IDs: " + declinedPostIds);
	    System.out.println("🔍 Declined post IDs count: " + declinedPostIds.size());
	    System.out.println("🔍 Accepted post IDs (global): " + acceptedPostIds);

	    List<PostingDTO> allPostings = postingClient.getAllPostings();
	    System.out.println("🔍 Total posts from posting service: " + allPostings.size());

	    List<PostingDTO> filteredPosts = allPostings.stream()
	            .filter(post -> {
	                String postLocation = post.getLocation();
	                boolean locationMatch = postLocation != null && postLocation.trim().equalsIgnoreCase(technicianLocation);
	                boolean notDeclined = !declinedPostIds.contains(post.getId());
	                boolean notAccepted = !acceptedPostIds.contains(post.getId());
	                
	                if (!locationMatch) {
	                    System.out.println("❌ Post " + post.getId() + " location mismatch: " + postLocation + " vs " + technicianLocation);
	                }
	                if (!notDeclined) {
	                    System.out.println("❌ Post " + post.getId() + " declined by technician");
	                }
	                if (!notAccepted) {
	                    System.out.println("❌ Post " + post.getId() + " already accepted by someone");
	                }
	                
	                return locationMatch && notDeclined && notAccepted;
	            })
	            .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
	            .collect(Collectors.toList());
	            
	    System.out.println("✅ Filtered posts count: " + filteredPosts.size());
	    return filteredPosts;
	}
	
	
	
	public Optional<Technician> getTechnicianByEmail(GetTechAccpetedPostsByEmailDto email) {
		return repo.findByEmailIgnoreCase(email.getEmail());
	}

	public List<Long> getAcceptedPostsByEmail(GetTechAccpetedPostsByEmailDto dto) {
		return acceptedPostRepo.findAllAcceptedPostIdsByEmail(dto.getEmail());
	}
	
	public List<Long> getDeclinedPostsByEmail(String email) {
		return declinedPostsRepo.findAllPostIdsByEmail(email);
	}

	public List<TechAcceptedPost> getAllAcceptedPostsWithTechnician() {
	    return acceptedPostRepo.findAll();
	}
	
	
	public Technician updateTechnicianProfile(UpdateTechnicianDto dto) {
	    Technician technician = repo.findByEmailIgnoreCase(dto.getEmail())
	            .orElseThrow(() -> new RuntimeException("Technician not found"));

	    if (dto.getName() != null && !dto.getName().isBlank() && !dto.getName().equals(technician.getName())) {
	        logChange(technician.getEmail(), "name", technician.getName(), dto.getName(), dto.getUpdatedBy());
	        technician.setName(dto.getName());
	    }

	    if (dto.getLocation() != null && !dto.getLocation().isBlank() && !dto.getLocation().equals(technician.getLocation())) {
	        logChange(technician.getEmail(), "location", technician.getLocation(), dto.getLocation(), dto.getUpdatedBy());
	        technician.setLocation(dto.getLocation());
	    }

	    if (dto.getZipcode() != null && !dto.getZipcode().isBlank() && !dto.getZipcode().equals(technician.getZipcode())) {
	        logChange(technician.getEmail(), "zipcode", technician.getZipcode(), dto.getZipcode(), dto.getUpdatedBy());
	        technician.setZipcode(dto.getZipcode());
	    }

	    if (dto.getYearsOfExperience() != null && !dto.getYearsOfExperience().isBlank() &&
	        !dto.getYearsOfExperience().equals(technician.getYearsOfExperience())) {
	        logChange(technician.getEmail(), "yearsOfExperience", technician.getYearsOfExperience(), dto.getYearsOfExperience(), dto.getUpdatedBy());
	        technician.setYearsOfExperience(dto.getYearsOfExperience());
	    }

	    return repo.save(technician);
	}

	private void logChange(String email, String field, String oldVal, String newVal, String updatedBy) {
	    if (oldVal != null && !oldVal.equals(newVal)) {
	        TechnicianAuditLog log = TechnicianAuditLog.builder()
	                .email(email)
	                .fieldName(field)
	                .oldValue(oldVal)
	                .newValue(newVal)
	                .updatedAt(LocalDateTime.now())
	                .updatedBy(updatedBy)
	                .build();
	        auditRepo.save(log);
	    }
	}
	
	public Optional<Technician> getTechnicianByEmail(String email) {
	    return repo.findByEmailIgnoreCase(email);
	}
	
}