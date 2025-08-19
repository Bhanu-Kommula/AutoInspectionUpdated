package com.auto.tech.controller;

import com.auto.tech.model.Technician;
import com.auto.tech.model.TechAcceptedPost;
import com.auto.tech.model.TechDeclinedPosts;
import com.auto.tech.model.TechCounterOffer;
import com.auto.tech.model.TechnicianPerformanceMetrics;
import com.auto.tech.model.TechnicianAuditLog;
import com.auto.tech.service.TechnicianService;
import com.auto.tech.service.CounterOfferService;
import com.auto.tech.service.TechnicianAnalyticsService;
import com.auto.tech.service.EnhancedTechnicianFeedService;
import com.auto.tech.repository.TechnicianRepository;
import com.auto.tech.repository.CounterOfferRepository;
import com.auto.tech.repository.AcceptedPostRepository;
import com.auto.tech.repository.DeclinedPostsRepository;
import com.auto.tech.repository.TechnicianPerformanceMetricsRepository;
import com.auto.tech.repository.TechnicianPostInteractionRepository;
import com.auto.tech.repository.TechnicianAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin Controller for Technician Service
 * Provides comprehensive admin endpoints for managing technicians, monitoring performance,
 * and overseeing business operations
 */
@RestController
@RequestMapping("/api/admin/technicians")
@RequiredArgsConstructor
@Slf4j
// @CrossOrigin - Removed to prevent duplicate CORS headers, gateway handles CORS
public class AdminController {

    private final TechnicianService technicianService;
    private final CounterOfferService counterOfferService;
    private final TechnicianAnalyticsService analyticsService;
    private final EnhancedTechnicianFeedService enhancedFeedService;
    private final TechnicianRepository technicianRepository;
    private final CounterOfferRepository counterOfferRepository;
    private final AcceptedPostRepository acceptedPostRepository;
    private final DeclinedPostsRepository declinedPostsRepository;
    private final TechnicianPerformanceMetricsRepository performanceMetricsRepository;
    private final TechnicianPostInteractionRepository interactionRepository;
    private final TechnicianAuditLogRepository auditLogRepository;

    // ==================== TECHNICIAN MANAGEMENT ENDPOINTS ====================

    /**
     * Get all technicians with pagination and filtering
     * GET /api/admin/technicians
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllTechnicians(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String experience,
            @RequestParam(required = false) String searchTerm) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<Technician> techniciansPage;
            
            if (location != null && !location.trim().isEmpty()) {
                techniciansPage = technicianRepository.findByLocationContainingIgnoreCase(location, pageable);
            } else if (experience != null && !experience.trim().isEmpty()) {
                techniciansPage = technicianRepository.findByYearsOfExperienceContainingIgnoreCase(experience, pageable);
            } else if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                techniciansPage = technicianRepository.findBySearchTerm(searchTerm, pageable);
            } else {
                techniciansPage = technicianRepository.findAll(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("technicians", techniciansPage.getContent());
            response.put("currentPage", techniciansPage.getNumber());
            response.put("totalPages", techniciansPage.getTotalPages());
            response.put("totalElements", techniciansPage.getTotalElements());
            response.put("size", techniciansPage.getSize());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching technicians: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch technicians"));
        }
    }

    /**
     * Advanced search technicians with multiple criteria
     * GET /api/admin/technicians/search
     */
    @GetMapping("/search")
    public ResponseEntity<?> advancedSearchTechnicians(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String zipcode,
            @RequestParam(required = false) String experience,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dealership,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortOrder.toUpperCase()), 
                               sortBy != null ? sortBy : "id");
            Pageable pageable = PageRequest.of(page, size, sort);
            
            // Get all technicians and apply filters
            List<Technician> allTechnicians = technicianRepository.findAll();
            List<Technician> filteredTechnicians = allTechnicians.stream()
                .filter(tech -> name == null || tech.getName().toLowerCase().contains(name.toLowerCase()))
                .filter(tech -> email == null || tech.getEmail().toLowerCase().contains(email.toLowerCase()))
                .filter(tech -> location == null || tech.getLocation().toLowerCase().contains(location.toLowerCase()))
                .filter(tech -> zipcode == null || tech.getZipcode().contains(zipcode))
                .filter(tech -> experience == null || tech.getYearsOfExperience().contains(experience))
                .filter(tech -> status == null || tech.getStatus().equalsIgnoreCase(status))
                .filter(tech -> dealership == null || 
                    (tech.getDelearshipName() != null && 
                     tech.getDelearshipName().toLowerCase().contains(dealership.toLowerCase())))
                .collect(Collectors.toList());
            
            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, filteredTechnicians.size());
            List<Technician> paginatedTechnicians = filteredTechnicians.subList(start, end);
            
            Map<String, Object> response = new HashMap<>();
            response.put("technicians", paginatedTechnicians);
            response.put("currentPage", page);
            response.put("totalPages", (int) Math.ceil((double) filteredTechnicians.size() / size));
            response.put("totalElements", filteredTechnicians.size());
            response.put("size", size);
            response.put("filters", Map.of(
                "name", name,
                "email", email,
                "location", location,
                "zipcode", zipcode,
                "experience", experience,
                "status", status,
                "dealership", dealership
            ));
            response.put("sortBy", sortBy != null ? sortBy : "id");
            response.put("sortOrder", sortOrder);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error performing advanced search: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to perform advanced search"));
        }
    }

    /**
     * Get technician by ID
     * GET /api/admin/technicians/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTechnicianById(@PathVariable Long id) {
        try {
            Optional<Technician> technician = technicianRepository.findById(id);
            if (technician.isPresent()) {
                return ResponseEntity.ok(technician.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching technician {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch technician"));
        }
    }

    /**
     * Update technician profile (admin override)
     * PUT /api/admin/technicians/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTechnician(@PathVariable Long id, @RequestBody Technician technician) {
        try {
            Optional<Technician> existingTech = technicianRepository.findById(id);
            if (existingTech.isPresent()) {
                Technician existing = existingTech.get();
                
                // Update fields
                if (technician.getName() != null) existing.setName(technician.getName());
                if (technician.getPhone() != null) existing.setPhone(technician.getPhone());
                if (technician.getLocation() != null) existing.setLocation(technician.getLocation());
                if (technician.getZipcode() != null) existing.setZipcode(technician.getZipcode());
                if (technician.getYearsOfExperience() != null) existing.setYearsOfExperience(technician.getYearsOfExperience());
                if (technician.getDelearshipName() != null) existing.setDelearshipName(technician.getDelearshipName());
                
                Technician updated = technicianRepository.save(existing);
                return ResponseEntity.ok(updated);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error updating technician {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update technician"));
        }
    }

    /**
     * Suspend technician account
     * PUT /api/admin/technicians/{id}/suspend
     */
    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendTechnician(@PathVariable Long id) {
        try {
            Optional<Technician> technicianOpt = technicianRepository.findById(id);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            technician.setStatus("SUSPENDED");
            Technician updated = technicianRepository.save(technician);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Technician suspended successfully",
                "technician", updated
            ));
        } catch (Exception e) {
            log.error("Error suspending technician {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to suspend technician"));
        }
    }

    /**
     * Activate suspended technician
     * PUT /api/admin/technicians/{id}/activate
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateTechnician(@PathVariable Long id) {
        try {
            Optional<Technician> technicianOpt = technicianRepository.findById(id);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            technician.setStatus("ACTIVE");
            Technician updated = technicianRepository.save(technician);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Technician activated successfully",
                "technician", updated
            ));
        } catch (Exception e) {
            log.error("Error activating technician {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to activate technician"));
        }
    }

    /**
     * Restore deleted technician
     * PUT /api/admin/technicians/{id}/restore
     */
    @PutMapping("/{id}/restore")
    public ResponseEntity<?> restoreTechnician(@PathVariable Long id) {
        try {
            Optional<Technician> technicianOpt = technicianRepository.findById(id);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            if (!"DELETED".equals(technician.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Technician is not deleted and cannot be restored"
                ));
            }
            
            technician.setStatus("ACTIVE");
            Technician updated = technicianRepository.save(technician);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Technician restored successfully",
                "technician", updated
            ));
        } catch (Exception e) {
            log.error("Error restoring technician {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to restore technician"));
        }
    }

    /**
     * Get technicians by status
     * GET /api/admin/technicians/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getTechniciansByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<Technician> technicianPage = technicianRepository.findByStatus(status, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("technicians", technicianPage.getContent());
            response.put("currentPage", page);
            response.put("totalPages", technicianPage.getTotalPages());
            response.put("totalElements", technicianPage.getTotalElements());
            response.put("size", size);
            response.put("status", status);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching technicians by status {}: {}", status, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch technicians by status"));
        }
    }

    /**
     * Delete technician (admin only)
     * DELETE /api/admin/technicians/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTechnician(@PathVariable Long id) {
        try {
            if (technicianRepository.existsById(id)) {
                // Check if technician has active engagements
                List<TechAcceptedPost> activePosts = acceptedPostRepository.findByEmail(
                    technicianRepository.findById(id).get().getEmail());
                
                if (!activePosts.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot delete technician with active post engagements",
                        "activePostsCount", activePosts.size()
                    ));
                }
                
                technicianRepository.deleteById(id);
                return ResponseEntity.ok(Map.of("message", "Technician deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting technician {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete technician"));
        }
    }

    /**
     * Get technician statistics
     * GET /api/admin/technicians/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getTechnicianStatistics() {
        try {
            long totalTechnicians = technicianRepository.count();
            long activeTechnicians = technicianRepository.countByLastActivityAfter(LocalDateTime.now().minusDays(30));
            long newTechniciansThisMonth = technicianRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(30));
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTechnicians", totalTechnicians);
            stats.put("activeTechnicians", activeTechnicians);
            stats.put("newTechniciansThisMonth", newTechniciansThisMonth);
            stats.put("inactiveTechnicians", totalTechnicians - activeTechnicians);
            stats.put("activityRate", totalTechnicians > 0 ? (double) activeTechnicians / totalTechnicians : 0.0);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching technician statistics: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch statistics"));
        }
    }

    // ==================== PERFORMANCE MONITORING ENDPOINTS ====================

    /**
     * Get all performance metrics
     * GET /api/admin/performance-metrics
     */
    @GetMapping("/performance-metrics")
    public ResponseEntity<Map<String, Object>> getAllPerformanceMetrics(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder) {
        
        try {
            Sort sort = Sort.by(Sort.Direction.DESC, sortBy != null ? sortBy : "totalEarnings");
            if ("asc".equalsIgnoreCase(sortOrder)) {
                sort = Sort.by(Sort.Direction.ASC, sortBy != null ? sortBy : "totalEarnings");
            }
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<TechnicianPerformanceMetrics> metricsPage = performanceMetricsRepository.findAll(pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("metrics", metricsPage.getContent());
            response.put("currentPage", metricsPage.getNumber());
            response.put("totalPages", metricsPage.getTotalPages());
            response.put("totalElements", metricsPage.getTotalElements());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching performance metrics: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch performance metrics"));
        }
    }

    /**
     * Get top performing technicians
     * GET /api/admin/performance-metrics/top-performers
     */
    @GetMapping("/performance-metrics/top-performers")
    public ResponseEntity<?> getTopPerformers(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "totalEarnings") String metric) {
        
        try {
            List<TechnicianPerformanceMetrics> topPerformers;
            
            switch (metric.toLowerCase()) {
                case "earnings":
                    topPerformers = performanceMetricsRepository.findTop10ByOrderByTotalEarningsDesc();
                    break;
                case "acceptance_rate":
                    topPerformers = performanceMetricsRepository.findTop10ByOrderBySuccessRateDesc();
                    break;
                case "posts_accepted":
                    topPerformers = performanceMetricsRepository.findTop10ByOrderByTotalPostsAcceptedDesc();
                    break;
                case "response_time":
                    topPerformers = performanceMetricsRepository.findTop10ByOrderByAvgResponseTimeMsAsc();
                    break;
                default:
                    topPerformers = performanceMetricsRepository.findTop10ByOrderByTotalEarningsDesc();
            }
            
            return ResponseEntity.ok(Map.of("topPerformers", topPerformers, "metric", metric));
        } catch (Exception e) {
            log.error("Error fetching top performers: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch top performers"));
        }
    }

    /**
     * Get performance summary
     * GET /api/admin/performance-metrics/summary
     */
    @GetMapping("/performance-metrics/summary")
    public ResponseEntity<?> getPerformanceSummary() {
        try {
            BigDecimal totalEarnings = performanceMetricsRepository.calculateTotalEarnings();
            Double avgSuccessRate = performanceMetricsRepository.calculateAverageSuccessRate();
            Long avgResponseTime = performanceMetricsRepository.calculateAverageResponseTime();
            Integer totalPostsAccepted = performanceMetricsRepository.calculateTotalPostsAccepted();
            Integer totalPostsDeclined = performanceMetricsRepository.calculateTotalPostsDeclined();
            
            // Handle null values safely
            if (totalEarnings == null) totalEarnings = BigDecimal.ZERO;
            if (avgSuccessRate == null) avgSuccessRate = 0.0;
            if (avgResponseTime == null) avgResponseTime = 0L;
            if (totalPostsAccepted == null) totalPostsAccepted = 0;
            if (totalPostsDeclined == null) totalPostsDeclined = 0;
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalEarnings", totalEarnings);
            summary.put("averageSuccessRate", avgSuccessRate);
            summary.put("averageResponseTime", avgResponseTime);
            summary.put("totalPostsAccepted", totalPostsAccepted);
            summary.put("totalPostsDeclined", totalPostsDeclined);
            summary.put("totalPosts", totalPostsAccepted + totalPostsDeclined);
            summary.put("overallSuccessRate", totalPostsAccepted + totalPostsDeclined > 0 ? 
                (double) totalPostsAccepted / (totalPostsAccepted + totalPostsDeclined) : 0.0);
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error fetching performance summary: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch performance summary"));
        }
    }

    // ==================== COUNTER OFFER MANAGEMENT ENDPOINTS ====================

    /**
     * Get all counter offers with filtering
     * GET /api/admin/counter-offers
     */
    @GetMapping("/counter-offers")
    public ResponseEntity<Map<String, Object>> getAllCounterOffers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String technicianEmail,
            @RequestParam(required = false) Long postId) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
            Page<TechCounterOffer> counterOffersPage;
            
            if (status != null && !status.trim().isEmpty()) {
                counterOffersPage = counterOfferRepository.findByStatus(
                    TechCounterOffer.CounterOfferStatus.valueOf(status.toUpperCase()), pageable);
            } else if (technicianEmail != null && !technicianEmail.trim().isEmpty()) {
                counterOffersPage = counterOfferRepository.findByTechnicianEmail(technicianEmail, pageable);
            } else if (postId != null) {
                counterOffersPage = counterOfferRepository.findByPostId(postId, pageable);
            } else {
                counterOffersPage = counterOfferRepository.findAll(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("counterOffers", counterOffersPage.getContent());
            response.put("currentPage", counterOffersPage.getNumber());
            response.put("totalPages", counterOffersPage.getTotalPages());
            response.put("totalElements", counterOffersPage.getTotalElements());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching counter offers: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch counter offers"));
        }
    }

    /**
     * Get counter offer statistics
     * GET /api/admin/counter-offers/statistics
     */
    @GetMapping("/counter-offers/statistics")
    public ResponseEntity<?> getCounterOfferStatistics() {
        try {
            long totalCounterOffers = counterOfferRepository.count();
            long pendingCounterOffers = counterOfferRepository.countByStatus(TechCounterOffer.CounterOfferStatus.PENDING);
            long acceptedCounterOffers = counterOfferRepository.countByStatus(TechCounterOffer.CounterOfferStatus.ACCEPTED);
            long rejectedCounterOffers = counterOfferRepository.countByStatus(TechCounterOffer.CounterOfferStatus.REJECTED);
            long withdrawnCounterOffers = counterOfferRepository.countByStatus(TechCounterOffer.CounterOfferStatus.WITHDRAWN);
            long expiredCounterOffers = counterOfferRepository.countByStatus(TechCounterOffer.CounterOfferStatus.EXPIRED);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCounterOffers", totalCounterOffers);
            stats.put("pendingCounterOffers", pendingCounterOffers);
            stats.put("acceptedCounterOffers", acceptedCounterOffers);
            stats.put("rejectedCounterOffers", rejectedCounterOffers);
            stats.put("withdrawnCounterOffers", withdrawnCounterOffers);
            stats.put("expiredCounterOffers", expiredCounterOffers);
            stats.put("acceptanceRate", totalCounterOffers > 0 ? (double) acceptedCounterOffers / totalCounterOffers : 0.0);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching counter offer statistics: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch counter offer statistics"));
        }
    }

    /**
     * Force expire counter offers (admin override)
     * POST /api/admin/counter-offers/{id}/force-expire
     */
    @PostMapping("/counter-offers/{id}/force-expire")
    public ResponseEntity<?> forceExpireCounterOffer(@PathVariable Long id) {
        try {
            Optional<TechCounterOffer> counterOffer = counterOfferRepository.findById(id);
            if (counterOffer.isPresent()) {
                TechCounterOffer offer = counterOffer.get();
                offer.markAsExpired();
                counterOfferRepository.save(offer);
                return ResponseEntity.ok(Map.of("message", "Counter offer expired successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error expiring counter offer {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to expire counter offer"));
        }
    }

    // ==================== POST ENGAGEMENT MONITORING ENDPOINTS ====================

    /**
     * Get all accepted posts
     * GET /api/admin/accepted-posts
     */
    @GetMapping("/accepted-posts")
    public ResponseEntity<Map<String, Object>> getAllAcceptedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String technicianEmail) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("acceptedAt").descending());
            Page<TechAcceptedPost> acceptedPostsPage;
            
            if (technicianEmail != null && !technicianEmail.trim().isEmpty()) {
                acceptedPostsPage = acceptedPostRepository.findByEmail(technicianEmail, pageable);
            } else {
                acceptedPostsPage = acceptedPostRepository.findAll(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("acceptedPosts", acceptedPostsPage.getContent());
            response.put("currentPage", acceptedPostsPage.getNumber());
            response.put("totalPages", acceptedPostsPage.getTotalPages());
            response.put("totalElements", acceptedPostsPage.getTotalElements());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching accepted posts: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch accepted posts"));
        }
    }

    /**
     * Get all declined posts
     * GET /api/admin/declined-posts
     */
    @GetMapping("/declined-posts")
    public ResponseEntity<Map<String, Object>> getAllDeclinedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String technicianEmail) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<TechDeclinedPosts> declinedPostsPage;
            
            if (technicianEmail != null && !technicianEmail.trim().isEmpty()) {
                declinedPostsPage = declinedPostsRepository.findByEmail(technicianEmail, pageable);
            } else {
                declinedPostsPage = declinedPostsRepository.findAll(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("declinedPosts", declinedPostsPage.getContent());
            response.put("currentPage", declinedPostsPage.getNumber());
            response.put("totalPages", declinedPostsPage.getTotalPages());
            response.put("totalElements", declinedPostsPage.getTotalElements());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching declined posts: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch declined posts"));
        }
    }

    /**
     * Get engagement statistics
     * GET /api/admin/engagement-statistics
     */
    @GetMapping("/engagement-statistics")
    public ResponseEntity<?> getEngagementStatistics() {
        try {
            long totalAcceptedPosts = acceptedPostRepository.count();
            long totalDeclinedPosts = declinedPostsRepository.count();
            long totalEngagements = totalAcceptedPosts + totalDeclinedPosts;
            
            // Get recent activity (last 30 days)
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            long recentAcceptedPosts = acceptedPostRepository.countByAcceptedAtAfter(thirtyDaysAgo);
            long recentDeclinedPosts = declinedPostsRepository.countByCreatedAtAfter(thirtyDaysAgo);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalAcceptedPosts", totalAcceptedPosts);
            stats.put("totalDeclinedPosts", totalDeclinedPosts);
            stats.put("totalEngagements", totalEngagements);
            stats.put("acceptanceRate", totalEngagements > 0 ? (double) totalAcceptedPosts / totalEngagements : 0.0);
            stats.put("recentAcceptedPosts", recentAcceptedPosts);
            stats.put("recentDeclinedPosts", recentDeclinedPosts);
            stats.put("recentEngagements", recentAcceptedPosts + recentDeclinedPosts);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching engagement statistics: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch engagement statistics"));
        }
    }

    // ==================== AUDIT AND MONITORING ENDPOINTS ====================

    /**
     * Get audit logs
     * GET /api/admin/audit-logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String fieldName) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
            Page<TechnicianAuditLog> auditLogsPage;
            
            if (email != null && !email.trim().isEmpty()) {
                auditLogsPage = auditLogRepository.findByEmail(email, pageable);
            } else if (fieldName != null && !fieldName.trim().isEmpty()) {
                auditLogsPage = auditLogRepository.findByFieldName(fieldName, pageable);
            } else {
                auditLogsPage = auditLogRepository.findAll(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("auditLogs", auditLogsPage.getContent());
            response.put("currentPage", auditLogsPage.getNumber());
            response.put("totalPages", auditLogsPage.getTotalPages());
            response.put("totalElements", auditLogsPage.getTotalElements());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching audit logs: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch audit logs"));
        }
    }

    /**
     * Get system health status
     * GET /api/admin/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> getSystemHealth() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", LocalDateTime.now());
            health.put("database", "CONNECTED");
            health.put("services", Map.of(
                "technicianService", "UP",
                "counterOfferService", "UP",
                "analyticsService", "UP",
                "enhancedFeedService", "UP"
            ));
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Error checking system health: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("status", "DOWN", "error", e.getMessage()));
        }
    }

    // ==================== BULK OPERATIONS ENDPOINTS ====================

    /**
     * Bulk update technician statuses
     * PUT /api/admin/technicians/bulk/status
     */
    @PutMapping("/bulk/status")
    public ResponseEntity<?> bulkUpdateTechnicianStatuses(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> technicianIds = (List<Long>) request.get("technicianIds");
            String newStatus = (String) request.get("status");
            String reason = (String) request.get("reason");
            
            if (technicianIds == null || technicianIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Technician IDs are required"));
            }
            
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "New status is required"));
            }
            
            List<Technician> updatedTechnicians = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (Long id : technicianIds) {
                try {
                    Optional<Technician> technicianOpt = technicianRepository.findById(id);
                    if (technicianOpt.isPresent()) {
                        Technician technician = technicianOpt.get();
                        technician.setStatus(newStatus);
                        Technician updated = technicianRepository.save(technician);
                        updatedTechnicians.add(updated);
                    } else {
                        errors.add("Technician with ID " + id + " not found");
                    }
                } catch (Exception e) {
                    errors.add("Failed to update technician " + id + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bulk status update completed");
            response.put("updatedCount", updatedTechnicians.size());
            response.put("totalRequested", technicianIds.size());
            response.put("newStatus", newStatus);
            response.put("updatedTechnicians", updatedTechnicians);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error performing bulk status update: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to perform bulk status update"));
        }
    }

    /**
     * Bulk delete technicians
     * DELETE /api/admin/technicians/bulk
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<?> bulkDeleteTechnicians(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> technicianIds = (List<Long>) request.get("technicianIds");
            
            if (technicianIds == null || technicianIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Technician IDs are required"));
            }
            
            List<Technician> deletedTechnicians = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (Long id : technicianIds) {
                try {
                    Optional<Technician> technicianOpt = technicianRepository.findById(id);
                    if (technicianOpt.isPresent()) {
                        Technician technician = technicianOpt.get();
                        
                        // Check if technician has active engagements
                        List<TechAcceptedPost> activePosts = acceptedPostRepository.findByEmail(technician.getEmail());
                        if (!activePosts.isEmpty()) {
                            errors.add("Technician " + id + " has " + activePosts.size() + " active post engagements");
                            continue;
                        }
                        
                        technicianRepository.deleteById(id);
                        deletedTechnicians.add(technician);
                    } else {
                        errors.add("Technician with ID " + id + " not found");
                    }
                } catch (Exception e) {
                    errors.add("Failed to delete technician " + id + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bulk deletion completed");
            response.put("deletedCount", deletedTechnicians.size());
            response.put("totalRequested", technicianIds.size());
            response.put("deletedTechnicians", deletedTechnicians);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error performing bulk deletion: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to perform bulk deletion"));
        }
    }

    // ==================== MAINTENANCE AND UTILITY ENDPOINTS ====================

    /**
     * Clean up expired data
     * POST /api/admin/maintenance/cleanup
     */
    @PostMapping("/maintenance/cleanup")
    public ResponseEntity<?> performMaintenanceCleanup() {
        try {
            // Clean up expired counter offers
            int expiredCounterOffers = counterOfferService.markExpiredCounterOffersScheduled();
            
            // Clean up old audit logs (older than 1 year)
            LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);
            long deletedAuditLogs = auditLogRepository.deleteByUpdatedAtBefore(oneYearAgo);
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Maintenance cleanup completed successfully");
            result.put("expiredCounterOffers", expiredCounterOffers);
            result.put("deletedAuditLogs", deletedAuditLogs);
            result.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error performing maintenance cleanup: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to perform maintenance cleanup"));
        }
    }

    /**
     * Export technician data
     * GET /api/admin/export/technicians
     */
    @GetMapping("/export/technicians")
    public ResponseEntity<?> exportTechniciansData(
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String location) {
        
        try {
            List<Technician> technicians;
            if (location != null && !location.trim().isEmpty()) {
                technicians = technicianRepository.findByLocationContainingIgnoreCase(location);
            } else {
                technicians = technicianRepository.findAll();
            }
            
            // For now, return JSON format. CSV export can be implemented later
            Map<String, Object> export = new HashMap<>();
            export.put("format", format != null ? format : "json");
            export.put("totalRecords", technicians.size());
            export.put("exportedAt", LocalDateTime.now());
            export.put("data", technicians);
            
            return ResponseEntity.ok(export);
        } catch (Exception e) {
            log.error("Error exporting technician data: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to export technician data"));
        }
    }

    /**
     * Export technician data as CSV
     * GET /api/admin/export/technicians/csv
     */
    @GetMapping("/export/technicians/csv")
    public ResponseEntity<?> exportTechniciansDataAsCSV(
            @RequestParam(required = false) String location) {
        
        try {
            List<Technician> technicians;
            if (location != null && !location.trim().isEmpty()) {
                technicians = technicianRepository.findByLocationContainingIgnoreCase(location);
            } else {
                technicians = technicianRepository.findAll();
            }
            
            // Generate CSV content
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("ID,Name,Email,Location,Zipcode,Years of Experience,Dealership Name,Status,Last Activity,Created At,Updated At\n");
            
            for (Technician tech : technicians) {
                csvContent.append(String.format("%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    tech.getId(),
                    escapeCsvField(tech.getName()),
                    escapeCsvField(tech.getEmail()),
                    escapeCsvField(tech.getLocation()),
                    escapeCsvField(tech.getZipcode()),
                    escapeCsvField(tech.getYearsOfExperience()),
                    escapeCsvField(tech.getDelearshipName() != null ? tech.getDelearshipName() : ""),
                    escapeCsvField(tech.getStatus()),
                    escapeCsvField(tech.getLastActivityAt() != null ? tech.getLastActivityAt().toString() : ""),
                    escapeCsvField(tech.getCreatedAt() != null ? tech.getCreatedAt().toString() : ""),
                    escapeCsvField(tech.getUpdatedAt() != null ? tech.getUpdatedAt().toString() : "")
                ));
            }
            
            Map<String, Object> export = new HashMap<>();
            export.put("format", "csv");
            export.put("totalRecords", technicians.size());
            export.put("exportedAt", LocalDateTime.now());
            export.put("csvContent", csvContent.toString());
            export.put("filename", "technicians_export_" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
            
            return ResponseEntity.ok(export);
        } catch (Exception e) {
            log.error("Error exporting technician data as CSV: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to export technician data as CSV"));
        }
    }

    /**
     * Helper method to escape CSV fields
     */
    private String escapeCsvField(String field) {
        if (field == null) return "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    /**
     * Get dashboard summary
     * GET /api/admin/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            // Technician statistics
            long totalTechnicians = technicianRepository.count();
            long activeTechnicians = technicianRepository.countByLastActivityAfter(LocalDateTime.now().minusDays(30));
            
            // Performance metrics
            BigDecimal totalEarnings = performanceMetricsRepository.calculateTotalEarnings();
            Double avgSuccessRate = performanceMetricsRepository.calculateAverageSuccessRate();
            
            // Handle null values safely
            if (totalEarnings == null) totalEarnings = BigDecimal.ZERO;
            if (avgSuccessRate == null) avgSuccessRate = 0.0;
            
            // Counter offer statistics
            long totalCounterOffers = counterOfferRepository.count();
            long pendingCounterOffers = counterOfferRepository.countByStatus(TechCounterOffer.CounterOfferStatus.PENDING);
            
            // Engagement statistics
            long totalAcceptedPosts = acceptedPostRepository.count();
            long totalDeclinedPosts = declinedPostsRepository.count();
            
            dashboard.put("technicians", Map.of(
                "total", totalTechnicians,
                "active", activeTechnicians,
                "inactive", totalTechnicians - activeTechnicians
            ));
            
            dashboard.put("performance", Map.of(
                "totalEarnings", totalEarnings,
                "averageSuccessRate", avgSuccessRate
            ));
            
            dashboard.put("counterOffers", Map.of(
                "total", totalCounterOffers,
                "pending", pendingCounterOffers
            ));
            
            dashboard.put("engagements", Map.of(
                "accepted", totalAcceptedPosts,
                "declined", totalDeclinedPosts,
                "total", totalAcceptedPosts + totalDeclinedPosts
            ));
            
            dashboard.put("lastUpdated", LocalDateTime.now());
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("Error fetching dashboard summary: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch dashboard summary"));
        }
    }
}
