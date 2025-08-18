package com.auto.postings.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import com.auto.postings.model.AcceptedPost;
import com.auto.postings.repository.AcceptedPostRepository;

import com.auto.postings.client.DealerClient;
import com.auto.postings.dto.DealerAcceptedPostUpdateFromTechDashDto;
import com.auto.postings.dto.DealerDTO;
import com.auto.postings.dto.DeletePostRequestByIdDto;
import com.auto.postings.dto.EditPostRequestDto;
import com.auto.postings.dto.GetAllPostsByEmailRequestDto;
import com.auto.postings.dto.GetByFiltersDto;
import com.auto.postings.model.PostStatus;
import com.auto.postings.model.Posting;
import com.auto.postings.repository.PostingRepository;
import com.auto.postings.webSocket.WebSocketDealerNotifier;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostingService {

	 private final DealerClient dealerClient;
	    private final PostingRepository repo;
	    private final WebSocketDealerNotifier webSocketDealerNotifier; // ✅ Inject
	    private final AcceptedPostRepository acceptedPostRepository;

	    public Posting savePosting(String email, String content, String location, String offerAmount, PostStatus status, String vin, String auctionLot) {
        // Fetch minimal dealer profile via API Gateway (email + name)
        DealerDTO dealer = dealerClient.getDealerProfileLite(email);

	        Posting posting = new Posting();
	        posting.setEmail(dealer.getEmail());
	        posting.setName(dealer.getName());
	        posting.setContent(content);
	        posting.setLocation(location);
	        posting.setOfferAmount(offerAmount);
	        posting.setStatus(status);
	        posting.setVin(vin);
	        posting.setAuctionLot(auctionLot);
	        posting.setCreatedAt(new Date());

	        Posting saved = repo.save(posting);

	        // ✅ Send real-time WebSocket broadcast to technicians
	        webSocketDealerNotifier.notifyNewPost(saved);

	        return saved;
	    }

	    public List<Posting> saveMultiplePostings(List<DealerAcceptedPostUpdateFromTechDashDto> postDtos) {
	        List<Posting> updatedPostings = new ArrayList<>();

	        for (DealerAcceptedPostUpdateFromTechDashDto dto : postDtos) {
	            Optional<Posting> optionalPost = repo.findById(dto.getPostId());

	            if (optionalPost.isPresent()) {
	                Posting post = optionalPost.get();
	                post.setStatus(dto.getStatus());
	                post.setAcceptedAt(dto.getAcceptedAt());  
	                post.setTechnicianEmail(dto.getTechnicianEmail());
	                post.setTechnicianName(dto.getTechnicianName());
	                post.setExpectedCompletionBy(dto.getExpectedCompletionBy());
	                
	                // ✅ Save to accepted_posts table if status is ACCEPTED
	                if (dto.getStatus() == PostStatus.ACCEPTED && dto.getTechnicianEmail() != null) {
	                    try {
	                        saveToAcceptedPostsTable(
	                            dto.getPostId(), 
	                            dto.getTechnicianEmail(), 
	                            post.getOfferAmount(), 
	                            "Post accepted by technician: " + dto.getTechnicianName()
	                        );
	                        log.info("✅ Saved to accepted_posts table for post: {}", dto.getPostId());
	                    } catch (Exception e) {
	                        log.error("❌ Failed to save to accepted_posts table for post {}: {}", dto.getPostId(), e.getMessage());
	                        // Don't fail the entire operation if accepted_posts save fails
	                    }
	                }
	               
	                updatedPostings.add(post);
	            } else {
	                System.out.println("Post ID not found: " + dto.getPostId());
	            }
	        }
	        
	        

	        return repo.saveAll(updatedPostings);
	    }


	    
	    
	    
	    
	    
	    
	    
	public List<Posting> getAllPosts(GetAllPostsByEmailRequestDto dto) {
		System.out.println("🔍 GET POSTS: Fetching posts for email: " + dto.getEmail());
	    List<Posting> posts = repo.findByEmailOrderByIdDesc(dto.getEmail()); // Now excludes DELETED posts
	    System.out.println("🔍 GET POSTS: Found " + posts.size() + " active posts (excluding DELETED)");
	    posts.forEach(p -> System.out.println("🔍 GET POSTS: Post ID " + p.getId() + " has status: " + p.getStatus()));
	    return posts;
	}
	


	public List<Posting> getAllPost() {
	    return repo.findAllActive(); // Now excludes DELETED posts
	}
	
	// ✅ SOFT DELETE: Get all deleted posts
	public List<Posting> getAllDeletedPosts() {
	    return repo.findAllDeleted();
	}
	
	// ✅ SOFT DELETE: Restore a deleted post
	public String restoreDeletedPost(Long id) {
	    Optional<Posting> post = repo.findById(id);
	    
	    if (post.isPresent()) {
	        Posting posting = post.get();
	        if (posting.getStatus() == PostStatus.DELETED) {
	            posting.setStatus(PostStatus.PENDING); // Restore to PENDING status
	            posting.setUpdatedAt(new Date());
	            repo.save(posting);
	            return "Post restored successfully with ID: " + id;
	        } else {
	            return "Post with ID: " + id + " is not deleted";
	        }
	    } else {
	        return "No post found with ID: " + id;
	    }
	}
	public Posting getPostById(Long id) {
	    return repo.findById(id).orElseThrow(() -> new RuntimeException("Post not found with ID: " + id));
	}
	public String deletePostById(DeletePostRequestByIdDto dto) {
		
		Long id = dto.getId();
		System.out.println("🔍 SOFT DELETE: Attempting to soft delete post with ID: " + id);
		
	    Optional<Posting> post = repo.findById(id);
	    
	    if (post.isPresent()) {
	        Posting posting = post.get();
	        System.out.println("🔍 SOFT DELETE: Found post with status: " + posting.getStatus());
	        System.out.println("🔍 SOFT DELETE: Current VIN: '" + posting.getVin() + "' (length: " + (posting.getVin() != null ? posting.getVin().length() : "null") + ")");
	        
	        // ✅ SOFT DELETE: Change status to DELETED instead of hard delete
	        posting.setStatus(PostStatus.DELETED);
	        posting.setUpdatedAt(new Date());
	        
	        System.out.println("🔍 SOFT DELETE: About to save post with VIN: '" + posting.getVin() + "'");
	        Posting savedPost = repo.save(posting);
	        System.out.println("🔍 SOFT DELETE: Post saved with new status: " + savedPost.getStatus());
	        
	        return "Post soft deleted with ID: " + id + " (status changed to DELETED)";
		} else {
	       System.out.println("🔍 SOFT DELETE: No post found with ID: " + id);
	       return "No post found with ID: " + id + ". Thank you";
	    }
	}


	public String updatePostById(EditPostRequestDto dto) {
	    Optional<Posting> optional = repo.findById(dto.getId());

	    if (optional.isPresent()) {
	        Posting post = optional.get();
	        if( post.getStatus() != PostStatus.COMPLETED) {
	            if (dto.getContent() != null) {
	                post.setContent(dto.getContent());
	            }
	            if (dto.getLocation() != null) {
	                post.setLocation(dto.getLocation());
	            }
	            if (dto.getOfferAmount() != null) {
	                post.setOfferAmount(dto.getOfferAmount());
	            }
	            if (dto.getVin() != null) {
	                post.setVin(dto.getVin());
	            }
	            if (dto.getAuctionLot() != null) {
	                post.setAuctionLot(dto.getAuctionLot());
	            }
	            
	            // ✅ Handle status updates when technician accepts
	            if (dto.getStatus() != null) {
	                post.setStatus(PostStatus.valueOf(dto.getStatus().toUpperCase()));
	                
	                // If status is being set to ACCEPTED, set acceptedAt timestamp and save to accepted_posts table
	                if ("ACCEPTED".equalsIgnoreCase(dto.getStatus())) {
	                    post.setAcceptedAt(new Date());
	                    
	                    // Set expected completion date (7 days from now)
	                    Date expectedCompletion = new Date();
	                    expectedCompletion.setTime(expectedCompletion.getTime() + (7 * 24 * 60 * 60 * 1000L));
	                    post.setExpectedCompletionBy(expectedCompletion);
	                    
	                    // ✅ Save to accepted_posts table
	                    try {
	                        saveToAcceptedPostsTable(
	                            dto.getId(), 
	                            dto.getTechnicianEmail(), 
	                            post.getOfferAmount(), 
	                            "Post accepted by technician: " + dto.getTechnicianName()
	                        );
	                        log.info("✅ Saved to accepted_posts table for post: {}", dto.getId());
	                    } catch (Exception e) {
	                        log.error("❌ Failed to save to accepted_posts table for post {}: {}", dto.getId(), e.getMessage());
	                        // Don't fail the entire operation if accepted_posts save fails
	                    }
	                }
	            }
	            
	            // ✅ Handle technician info updates
	            if (dto.getTechnicianName() != null) {
	                post.setTechnicianName(dto.getTechnicianName());
	            }
	                        if (dto.getTechnicianEmail() != null) {
                post.setTechnicianEmail(dto.getTechnicianEmail());
            }
            
            // Handle inspection report ID updates
            if (dto.getInspectionReportId() != null) {
                post.setInspectionReportId(dto.getInspectionReportId());
            }
            
            post.setUpdatedAt(new Date());

	            repo.save(post);
	            return "Post updated successfully with ID: " + dto.getId();
	        } else {
	            return "Post Cannot be edited - status is COMPLETED";
	        }
	    } else {
	        return "Post not found with ID: " + dto.getId();
	    }
	}
	

	
	public List<Posting> getByFilter(GetByFiltersDto dto) {
	    
	    List<Posting> posts = repo.findByEmailOrderByIdDesc(dto.getEmail());

	    return posts.stream()
	        .filter(p -> dto.getLocation() == null || p.getLocation().equalsIgnoreCase(dto.getLocation()))
	        .filter(p -> dto.getOfferAmount() == null || p.getOfferAmount().equalsIgnoreCase(dto.getOfferAmount()))
	        .filter(p -> dto.getStatus() == null || p.getStatus().name().equalsIgnoreCase(dto.getStatus()))
	        .collect(Collectors.toList());
	}

	/**
	 * Accept post directly by technician (for counter offers) - ATOMIC operation
	 * Enhanced with better validation and error handling
	 */
	@Transactional(rollbackFor = Exception.class)
	public boolean acceptPostDirectly(Long postId, String technicianEmail, String newOfferAmount) {
	    try {
	        log.info("Accepting post directly: postId={}, technicianEmail={}, newOfferAmount={}", 
	               postId, technicianEmail, newOfferAmount);
	        
	        // Input validation
	        if (postId == null) {
	            log.error("Post ID cannot be null");
	            return false;
	        }
	        if (technicianEmail == null || technicianEmail.trim().isEmpty()) {
	            log.error("Technician email cannot be null or empty");
	            return false;
	        }
	        
	        // Use pessimistic locking to prevent race conditions
	        Optional<Posting> postOpt = repo.findByIdWithLock(postId);
	        if (postOpt.isEmpty()) {
	            log.error("Post not found: {}", postId);
	            return false;
	        }

	        Posting post = postOpt.get();
	        if (post.getStatus() != PostStatus.PENDING) {
	            log.error("Post is not in PENDING status. Current status: {} for post {}", post.getStatus(), postId);
	            return false;
	        }

	        // Get technician name from technician email if possible
	        String technicianName = null;
	        try {
	            // TODO: Add integration with technician service to get technician name
	            // For now, we'll extract name from email or use email as name
	            if (technicianEmail.contains("@")) {
	                technicianName = technicianEmail.substring(0, technicianEmail.indexOf("@"));
	            }
	        } catch (Exception e) {
	            log.warn("Failed to extract technician name from email {}: {}", technicianEmail, e.getMessage());
	        }

	        // Update post status to ACCEPTED
	        post.setStatus(PostStatus.ACCEPTED);
	        post.setAcceptedAt(new Date());
	        post.setTechnicianEmail(technicianEmail);
	        
	        // Set technician name if available
	        if (technicianName != null && !technicianName.trim().isEmpty()) {
	            post.setTechnicianName(technicianName);
	        }
	        
	        // Update offer amount if provided (for counter offers)
	        if (newOfferAmount != null && !newOfferAmount.trim().isEmpty()) {
	            String oldAmount = post.getOfferAmount();
	            post.setOfferAmount(newOfferAmount);
	            log.info("Updated offer amount from '{}' to '{}' for post {}", oldAmount, newOfferAmount, postId);
	        }
	        
	        // Set expected completion date (7 days from now)
	        Date expectedCompletion = new Date();
	        expectedCompletion.setTime(expectedCompletion.getTime() + (7 * 24 * 60 * 60 * 1000L));
	        post.setExpectedCompletionBy(expectedCompletion);
	        
	        post.setUpdatedAt(new Date());
	        repo.save(post);
	        
	        // ✅ Save to accepted_posts table
	        try {
	            saveToAcceptedPostsTable(
	                postId, 
	                technicianEmail, 
	                post.getOfferAmount(), 
	                "Post accepted by technician: " + (technicianName != null ? technicianName : technicianEmail)
	            );
	            log.info("✅ Saved to accepted_posts table for post: {}", postId);
	        } catch (Exception e) {
	            log.error("❌ Failed to save to accepted_posts table for post {}: {}", postId, e.getMessage());
	            // Don't fail the entire operation if accepted_posts save fails
	        }
	        
	        log.info("Successfully accepted post: id={}, technicianEmail={}, finalOfferAmount={}, acceptedAt={}", 
	               postId, technicianEmail, post.getOfferAmount(), post.getAcceptedAt());
	        return true;
	        
	    } catch (Exception e) {
	        log.error("Error accepting post directly: postId={}, technicianEmail={}, error={}", 
	                 postId, technicianEmail, e.getMessage(), e);
	        return false;
	    }
	}

	/**
	 * Accept post with counter offer - Enhanced method for counter offer flow
	 */
	public boolean acceptPostWithCounterOffer(Long postId, String technicianEmail, String newOfferAmount, String dealerEmail) {
	    try {
	        log.info("Starting acceptPostWithCounterOffer: postId={}, technicianEmail={}, newOfferAmount={}, dealerEmail={}", 
	               postId, technicianEmail, newOfferAmount, dealerEmail);
	        
	        // Accept post directly with the new counter offer amount
	        boolean postAccepted = acceptPostDirectly(postId, technicianEmail, newOfferAmount);
	        if (!postAccepted) {
	            log.error("Failed to accept post directly: {}", postId);
	            return false;
	        }
	        
	        log.info("Successfully accepted post with counter offer: {}", postId);
	        return true;
	    } catch (Exception e) {
	        log.error("Error accepting post with counter offer: postId={}, error={}", postId, e.getMessage(), e);
	        return false;
	    }
	}

	/**
	 * Update post offer amount - separated for better transaction handling - ATOMIC operation
	 */
	@Transactional(rollbackFor = Exception.class)
	public boolean updatePostOfferAmount(Long postId, String newOfferAmount) {
	    try {
	        log.info("Updating offer amount for post {}: {}", postId, newOfferAmount);
	        
	        // Use pessimistic locking to prevent race conditions during amount update
	        Optional<Posting> postOpt = repo.findByIdWithLock(postId);
	        if (postOpt.isEmpty()) {
	            log.error("Post not found for amount update: {}", postId);
	            return false;
	        }

	        Posting post = postOpt.get();
	        String oldAmount = post.getOfferAmount();
	        post.setOfferAmount(newOfferAmount);
	        post.setUpdatedAt(new Date());
	        
	        repo.save(post);
	        log.info("Updated offer amount from '{}' to '{}' for post {}", oldAmount, newOfferAmount, postId);
	        return true;
	    } catch (Exception e) {
	        log.error("Error updating offer amount for post {}: {}", postId, e.getMessage(), e);
	        return false;
	    }
	}

	/**
	 * Save to accepted posts table with database-level uniqueness enforcement
	 * DATABASE CONSTRAINT: unique(post_id) prevents duplicate acceptances automatically
	 */
	@Transactional(rollbackFor = Exception.class)
	public void saveToAcceptedPostsTable(Long postId, String technicianEmail, String offerAmount, String notes) {
	    try {
	        log.info("Creating accepted post record: postId={}, technicianEmail={}, offerAmount={}", 
	               postId, technicianEmail, offerAmount);
	        
	        // ✅ FIXED: Check if record already exists before attempting to save
	        log.info("Checking if accepted post record already exists for postId: {}", postId);
	        Optional<AcceptedPost> existingRecord = acceptedPostRepository.findByPostId(postId);
	        if (existingRecord.isPresent()) {
	            log.warn("Post {} already has an accepted post record - skipping creation. Existing record: {}", 
	                    postId, existingRecord.get());
	            // Don't throw an error, just log and return since this is expected behavior
	            return;
	        }
	        log.info("No existing accepted post record found for postId: {}, proceeding with creation", postId);
	        
	        // Create and save the accepted post record
	        AcceptedPost acceptedPost = new AcceptedPost(postId, technicianEmail, offerAmount, notes);
	        log.info("Created AcceptedPost object: {}", acceptedPost);
	        
	        AcceptedPost saved = acceptedPostRepository.save(acceptedPost);
	        
	        log.info("Successfully created accepted post record: id={}, postId={}, technicianEmail={}", 
	               saved.getId(), saved.getPostId(), saved.getTechnicianEmail());
	        
	    } catch (org.springframework.dao.DataIntegrityViolationException e) {
	        // This should not happen anymore with the above check, but keep as fallback
	        log.error("DataIntegrityViolationException for post {}: {}", postId, e.getMessage(), e);
	        log.warn("Post {} already accepted by another technician - database constraint prevented duplicate", postId);
	        throw new IllegalStateException("Post " + postId + " has already been accepted by another technician", e);
	    } catch (Exception e) {
	        log.error("Error saving to accepted posts table for post {}: {}", postId, e.getMessage(), e);
	        throw new RuntimeException("Failed to save to accepted posts table: " + e.getMessage(), e);
	    }
	}

	/**
	 * Save to declined posts table (integration point for declined posts tracking)
	 */
	public void saveToDeclinedPostsTable(Long postId, String technicianEmail, String offerAmount, String reason) {
	    try {
	        log.info("Saving to declined posts table - Post: {}, Technician: {}, Reason: {}, Amount: {}", 
	                postId, technicianEmail, reason, offerAmount);
	        
	        // ✅ FIXED: This is a placeholder method that should not throw exceptions
	        // In a real implementation, this would call the declined posts service or save to declined_posts table
	        // For now, just log the information without failing the transaction
	        
	        // TODO: Integrate with declined posts service or repository
	        // Example: declinedPostsService.createDeclinedPost(postId, technicianEmail, reason, parseAmount(offerAmount));
	        
	        log.info("Successfully logged declined post information for post: {}, technician: {}", postId, technicianEmail);
	        
	    } catch (Exception e) {
	        // ✅ FIXED: Don't throw exceptions that could cause transaction rollback
	        log.error("Error in saveToDeclinedPostsTable for post {}: {} - This is non-critical, continuing...", 
	                postId, e.getMessage());
	        // Don't re-throw - this is not critical for the main transaction
	    }
	}

	// ==================== ADMIN METHODS ====================

	/**
	 * Get all posts for admin with pagination and filtering
	 */
	public List<Posting> getAllPostsForAdmin(Map<String, Object> filters, int page, int size) {
		try {
			log.info("Getting all posts for admin with filters: {}, page: {}, size: {}", filters, page, size);
			
			// Extract filter values
			String status = (String) filters.get("status");
			String location = (String) filters.get("location");
			String dealerEmail = (String) filters.get("dealerEmail");
			String search = (String) filters.get("search");
			
			// Apply filters and get posts
			List<Posting> posts = repo.findAllWithFilters(status, location, dealerEmail, search);
			
			// Apply pagination manually since JPA doesn't support dynamic pagination with custom queries
			int startIndex = page * size;
			int endIndex = Math.min(startIndex + size, posts.size());
			
			if (startIndex < posts.size()) {
				posts = posts.subList(startIndex, endIndex);
			} else {
				posts = List.of();
			}
			
			log.info("Retrieved {} posts for admin", posts.size());
			return posts;
		} catch (Exception e) {
			log.error("Error getting all posts for admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get posts for admin: " + e.getMessage());
		}
	}

	/**
	 * Get total posts count for admin with filters
	 */
	public long getTotalPostsCount(Map<String, Object> filters) {
		try {
			log.info("Getting total posts count for admin with filters: {}", filters);
			
			// Extract filter values
			String status = (String) filters.get("status");
			String location = (String) filters.get("location");
			String dealerEmail = (String) filters.get("dealerEmail");
			String search = (String) filters.get("search");
			
			long count = repo.countWithFilters(status, location, dealerEmail, search);
			
			log.info("Total posts count for admin: {}", count);
			return count;
		} catch (Exception e) {
			log.error("Error getting total posts count for admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get posts count for admin: " + e.getMessage());
		}
	}

	/**
	 * Update post status by admin
	 */
	@Transactional
	public void updatePostStatusByAdmin(Long postId, PostStatus newStatus, String reason, String adminEmail) {
		try {
			log.info("Admin {} updating post {} status to {} with reason: {}", adminEmail, postId, newStatus, reason);
			
			Optional<Posting> postOpt = repo.findById(postId);
			if (postOpt.isEmpty()) {
				throw new IllegalArgumentException("Post not found with ID: " + postId);
			}

			Posting post = postOpt.get();
			PostStatus oldStatus = post.getStatus();
			post.setStatus(newStatus);
			post.setUpdatedAt(new Date());
			
			// Log the status change
			log.info("Post {} status changed from {} to {} by admin {}", postId, oldStatus, newStatus, adminEmail);
			
			repo.save(post);
		} catch (Exception e) {
			log.error("Error updating post status by admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to update post status: " + e.getMessage());
		}
	}

	/**
	 * Delete post by admin (hard delete)
	 */
	@Transactional
	public void deletePostByAdmin(Long postId, String reason, String adminEmail) {
		try {
			log.info("Admin {} deleting post {} with reason: {}", adminEmail, postId, reason);
			
			Optional<Posting> postOpt = repo.findById(postId);
			if (postOpt.isEmpty()) {
				throw new IllegalArgumentException("Post not found with ID: " + postId);
			}

			// Hard delete the post
			repo.deleteById(postId);
			
			log.info("Post {} deleted by admin {}", postId, adminEmail);
		} catch (Exception e) {
			log.error("Error deleting post by admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to delete post: " + e.getMessage());
		}
	}

	/**
	 * Restore deleted post by admin
	 */
	@Transactional
	public void restorePostByAdmin(Long postId, String adminEmail) {
		try {
			log.info("Admin {} restoring deleted post {}", adminEmail, postId);
			
			Optional<Posting> postOpt = repo.findById(postId);
			if (postOpt.isEmpty()) {
				throw new IllegalArgumentException("Post not found with ID: " + postId);
			}

			Posting post = postOpt.get();
			
			// Check if post is actually deleted (soft delete)
			if (post.getStatus() != PostStatus.DELETED) {
				throw new IllegalArgumentException("Post with ID " + postId + " is not deleted. Current status: " + post.getStatus());
			}
			
			// Restore to PENDING status
			post.setStatus(PostStatus.PENDING);
			post.setUpdatedAt(new Date());
			
			// Clear any deletion-related fields
			// post.setDeletedAt(null); // If you have this field
			
			repo.save(post);
			
			log.info("Post {} restored successfully by admin {} to status {}", postId, adminEmail, PostStatus.PENDING);
		} catch (Exception e) {
			log.error("Error restoring post by admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to restore post: " + e.getMessage());
		}
	}

	/**
	 * Bulk update post statuses by admin
	 */
	@Transactional
	public int bulkUpdatePostStatuses(List<Long> postIds, PostStatus newStatus, String reason, String adminEmail) {
		try {
			log.info("Admin {} bulk updating {} posts to status {} with reason: {}", 
					adminEmail, postIds.size(), newStatus, reason);
			
			int updatedCount = 0;
			for (Long postId : postIds) {
				try {
					updatePostStatusByAdmin(postId, newStatus, reason, adminEmail);
					updatedCount++;
				} catch (Exception e) {
					log.error("Failed to update post {} in bulk operation: {}", postId, e.getMessage());
					// Continue with other posts
				}
			}
			
			log.info("Bulk status update completed: {} out of {} posts updated", updatedCount, postIds.size());
			return updatedCount;
		} catch (Exception e) {
			log.error("Error in bulk status update: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to perform bulk status update: " + e.getMessage());
		}
	}

	/**
	 * Bulk delete posts by admin
	 */
	@Transactional
	public int bulkDeletePosts(List<Long> postIds, String reason, String adminEmail) {
		try {
			log.info("Admin {} bulk deleting {} posts with reason: {}", adminEmail, postIds.size(), reason);
			
			int deletedCount = 0;
			for (Long postId : postIds) {
				try {
					deletePostByAdmin(postId, reason, adminEmail);
					deletedCount++;
				} catch (Exception e) {
					log.error("Failed to delete post {} in bulk operation: {}", postId, e.getMessage());
					// Continue with other posts
				}
			}
			
			log.info("Bulk delete completed: {} out of {} posts deleted", deletedCount, postIds.size());
			return deletedCount;
		} catch (Exception e) {
			log.error("Error in bulk delete: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to perform bulk delete: " + e.getMessage());
		}
	}

	/**
	 * Get posting statistics for admin
	 */
	public Map<String, Object> getPostingStatistics(String dateFrom, String dateTo) {
		try {
			log.info("Getting posting statistics from {} to {}", dateFrom, dateTo);
			
			Map<String, Object> stats = new HashMap<>();
			
			// Get total posts count
			long totalPosts = repo.count();
			stats.put("totalPosts", totalPosts);
			
			// Get posts by status
			stats.put("pendingPosts", repo.countByStatus(PostStatus.PENDING));
			stats.put("acceptedPosts", repo.countByStatus(PostStatus.ACCEPTED));
			stats.put("cancelledPosts", repo.countByStatus(PostStatus.CANCELLED));
			stats.put("completedPosts", repo.countByStatus(PostStatus.COMPLETED));
			
			// Get posts by date range if provided
			if (dateFrom != null && dateTo != null) {
				try {
					// Validate date format
					java.time.LocalDate.parse(dateFrom);
					java.time.LocalDate.parse(dateTo);
					
					// TODO: Implement actual date range filtering in repository
					// For now, set a placeholder
					stats.put("postsInDateRange", 0);
					stats.put("dateRange", Map.of("from", dateFrom, "to", dateTo));
				} catch (Exception e) {
					log.warn("Invalid date format in statistics request: {} to {}", dateFrom, dateTo);
					stats.put("postsInDateRange", 0);
					stats.put("dateRangeError", "Invalid date format. Use YYYY-MM-DD");
				}
			}
			
			log.info("Posting statistics generated: {}", stats);
			return stats;
		} catch (Exception e) {
			log.error("Error getting posting statistics: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get posting statistics: " + e.getMessage());
		}
	}

	/**
	 * Get posts by date range for admin
	 */
	public List<Posting> getPostsByDateRange(String dateFrom, String dateTo, int page, int size) {
		try {
			log.info("Getting posts by date range from {} to {}, page: {}, size: {}", dateFrom, dateTo, page, size);
			
			// Validate date parameters
			if (dateFrom == null || dateTo == null) {
				throw new IllegalArgumentException("Both dateFrom and dateTo are required");
			}
			
			// Parse dates (simple format validation)
			try {
				java.time.LocalDate.parse(dateFrom);
				java.time.LocalDate.parse(dateTo);
			} catch (Exception e) {
				throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD format");
			}
			
			// For now, return all posts with pagination since date filtering is not implemented in repository
			// TODO: Implement date range filtering in repository
			List<Posting> posts = repo.findAllWithPagination(page, size);
			
			log.info("Retrieved {} posts by date range", posts.size());
			return posts;
		} catch (Exception e) {
			log.error("Error getting posts by date range: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get posts by date range: " + e.getMessage());
		}
	}

	/**
	 * Get total posts count by date range for admin
	 */
	public long getTotalPostsByDateRange(String dateFrom, String dateTo) {
		try {
			log.info("Getting total posts count by date range from {} to {}", dateFrom, dateTo);
			
			// TODO: Implement date range filtering
			// For now, return total count
			long count = repo.count();
			
			log.info("Total posts count by date range: {}", count);
			return count;
		} catch (Exception e) {
			log.error("Error getting total posts count by date range: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get posts count by date range: " + e.getMessage());
		}
	}

	/**
	 * Export posts data for admin
	 */
	public String exportPostsData(String format, String status, String dateFrom, String dateTo) {
		try {
			log.info("Exporting posts data - format: {}, status: {}, dateFrom: {}, dateTo: {}", 
					format, status, dateFrom, dateTo);
			
			// Validate format parameter
			if (format == null || format.trim().isEmpty()) {
				format = "csv"; // Default to CSV
			}
			
			// Only support CSV for now
			if (!"csv".equalsIgnoreCase(format.trim())) {
				throw new IllegalArgumentException("Only CSV format is supported. Requested format: " + format);
			}
			
			// Apply filters if provided
			List<Posting> posts;
			if (status != null && !status.trim().isEmpty()) {
				try {
					PostStatus postStatus = PostStatus.valueOf(status.trim().toUpperCase());
					// Use the existing filter method instead of findByStatus
					Map<String, Object> filters = new HashMap<>();
					filters.put("status", postStatus.name());
					posts = repo.findAllWithFilters(postStatus.name(), null, null, null);
				} catch (IllegalArgumentException e) {
					throw new IllegalArgumentException("Invalid status value: " + status + ". Valid values: " + 
						Arrays.stream(PostStatus.values()).map(Enum::name).collect(Collectors.joining(", ")));
				}
			} else {
				posts = repo.findAll();
			}
			
			// TODO: Implement date range filtering
			// For now, export all posts matching status filter
			
			// Generate CSV
			StringBuilder csv = new StringBuilder();
			csv.append("ID,Email,Content,Location,OfferAmount,Status,CreatedAt,UpdatedAt\n");
			
			for (Posting post : posts) {
				csv.append(String.format("%d,%s,%s,%s,%s,%s,%s,%s\n",
					post.getId(),
					post.getEmail() != null ? post.getEmail().replace(",", ";") : "",
					post.getContent() != null ? post.getContent().replace(",", ";") : "",
					post.getLocation() != null ? post.getLocation().replace(",", ";") : "",
					post.getOfferAmount() != null ? post.getOfferAmount().replace(",", ";") : "",
					post.getStatus(),
					post.getCreatedAt(),
					post.getUpdatedAt()
				));
			}
			
			log.info("Posts data exported successfully in {} format. Total posts: {}", format, posts.size());
			return csv.toString();
		} catch (Exception e) {
			log.error("Error exporting posts data: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to export posts data: " + e.getMessage());
		}
	}

}
	
	


	
    

