package com.auto.technician.dashboard.service;

import com.auto.technician.dashboard.dto.PostDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Posts Service Client
 * HTTP client to communicate with posts-service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostsServiceClient {

    private final WebClient webClient;

    @Value("${posts-service.url:http://localhost:8083/api/v1}")
    private String postsServiceUrl;

    @Value("${app.webclient.timeout:10000}")
    private int timeout = 10000;

    /**
     * Get posts assigned to a specific technician
     */
    public List<PostDto> getAssignedPosts(Long technicianId, String jwtToken) {
        try {
            log.debug("Fetching assigned posts for technician: {}", technicianId);

            // Return mock data for development or no-auth cases
            if ("mock-jwt-token-for-development".equals(jwtToken) || "no-auth-required".equals(jwtToken)) {
                return createMockAssignedPosts(technicianId);
            }

            Mono<Map<String, Object>> response = webClient.get()
                    .uri(postsServiceUrl + "/posts/assigned/" + technicianId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), 
                        clientResponse -> Mono.error(new ServiceCommunicationException(
                            "Client error from posts service: " + clientResponse.statusCode().value())))
                    .onStatus(status -> status.is5xxServerError(), 
                        clientResponse -> Mono.error(new ServiceCommunicationException(
                            "Server error from posts service: " + clientResponse.statusCode().value())))
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofMillis(timeout));

            Map<String, Object> responseBody = response.block();
            
            if (responseBody != null && responseBody.containsKey("posts")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> postsData = (List<Map<String, Object>>) responseBody.get("posts");
                
                List<PostDto> posts = new ArrayList<>();
                for (Map<String, Object> postData : postsData) {
                    PostDto post = mapToPostDto(postData);
                    posts.add(post);
                }
                
                log.info("Retrieved {} assigned posts for technician: {}", posts.size(), technicianId);
                return posts;
            }

            return new ArrayList<>();

        } catch (WebClientResponseException e) {
            log.error("HTTP error fetching assigned posts for technician {}: {} - {}", 
                        technicianId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new ServiceCommunicationException("Failed to fetch assigned posts", e);
        } catch (Exception e) {
            log.error("Unexpected error fetching assigned posts for technician {}: {}", technicianId, e.getMessage(), e);
            return new ArrayList<>(); // Return empty list instead of throwing exception
        }
    }

    /**
     * Update post status
     */
    public boolean updatePostStatus(Long postId, String status, Long technicianId, String jwtToken) {
        try {
            log.debug("Updating post {} status to {} for technician: {}", postId, status, technicianId);

            // Return success for no-auth cases
            if ("no-auth-required".equals(jwtToken)) {
                log.info("Mock success for post {} status update to {} for technician {}", postId, status, technicianId);
                return true;
            }

            Map<String, Object> requestBody = Map.of(
                "status", status,
                "assignedTechnicianId", technicianId
            );

            Mono<Map<String, Object>> response = webClient.put()
                    .uri(postsServiceUrl + "/posts/" + postId + "/status")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status1 -> status1.is4xxClientError(), 
                        clientResponse -> Mono.error(new ServiceCommunicationException(
                            "Client error from posts service: " + clientResponse.statusCode().value())))
                    .onStatus(status1 -> status1.is5xxServerError(), 
                        clientResponse -> Mono.error(new ServiceCommunicationException(
                            "Server error from posts service: " + clientResponse.statusCode().value())))
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofMillis(timeout));

            Map<String, Object> responseBody = response.block();
            boolean success = responseBody != null && Boolean.TRUE.equals(responseBody.get("success"));
            
            if (success) {
                log.info("Successfully updated post {} status to {} for technician {}", postId, status, technicianId);
            } else {
                log.warn("Failed to update post {} status to {} for technician {}", postId, status, technicianId);
            }
            
            return success;

        } catch (WebClientResponseException e) {
            log.error("HTTP error updating post {} status for technician {}: {} - {}", 
                        postId, technicianId, e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error updating post {} status for technician {}: {}", postId, technicianId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Update post inspection report ID
     */
    public boolean updatePostInspectionReportId(Long postId, Long inspectionReportId) {
        try {
            log.debug("Updating post {} inspection report ID to {}", postId, inspectionReportId);

            Map<String, Object> requestBody = Map.of(
                "id", postId,
                "inspectionReportId", inspectionReportId
            );

            Mono<Map<String, Object>> response = webClient.post()
                    .uri(postsServiceUrl + "/posts-update-id")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), 
                        clientResponse -> Mono.error(new ServiceCommunicationException(
                            "Client error from posts service: " + clientResponse.statusCode().value())))
                    .onStatus(status -> status.is5xxServerError(), 
                        clientResponse -> Mono.error(new ServiceCommunicationException(
                            "Server error from posts service: " + clientResponse.statusCode().value())))
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofMillis(timeout));

            Map<String, Object> responseBody = response.block();
            boolean success = responseBody != null;
            
            if (success) {
                log.info("Successfully updated post {} inspection report ID to {}", postId, inspectionReportId);
            } else {
                log.warn("Failed to update post {} inspection report ID to {}", postId, inspectionReportId);
            }
            
            return success;

        } catch (WebClientResponseException e) {
            log.error("HTTP error updating post {} inspection report ID: {} - {}", 
                        postId, e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error updating post {} inspection report ID: {}", postId, e.getMessage(), e);
            return false;
        }
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Map response data to PostDto object
     */
    private PostDto mapToPostDto(Map<String, Object> postData) {
        PostDto post = new PostDto();
        
        post.setId(getLong(postData, "id"));
        post.setDealerPostId(getLong(postData, "dealerPostId"));
        post.setDealerName(getString(postData, "dealerName"));
        post.setAssignedTechnicianId(getLong(postData, "assignedTechnicianId"));
        post.setAssignedTechnicianName(getString(postData, "assignedTechnicianName"));
        post.setAssignedTechnicianEmail(getString(postData, "assignedTechnicianEmail"));
        post.setName(getString(postData, "name"));
        post.setEmail(getString(postData, "email"));
        post.setContent(getString(postData, "content"));
        post.setLocation(getString(postData, "location"));
        post.setOfferAmount(getString(postData, "offerAmount"));
        post.setVin(getString(postData, "vin"));
        post.setAuctionLot(getString(postData, "auctionLot"));
        post.setStatus(getString(postData, "status"));
        post.setCreatedAt(getString(postData, "createdAt"));
        post.setUpdatedAt(getString(postData, "updatedAt"));
        post.setAcceptedAt(getString(postData, "acceptedAt"));
        post.setEstimatedCompletionTime(getString(postData, "estimatedCompletionTime"));
        
        // Additional vehicle information
        post.setMake(getString(postData, "make"));
        post.setModel(getString(postData, "model"));
        post.setYear(getInteger(postData, "year"));
        post.setColor(getString(postData, "color"));
        post.setMileage(getInteger(postData, "mileage"));
        
        return post;
    }

    private String getString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value != null ? value.toString() : null;
    }

    private Long getLong(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }

    private Integer getInteger(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    /**
     * Create mock assigned posts for development
     */
    private List<PostDto> createMockAssignedPosts(Long technicianId) {
        List<PostDto> mockPosts = new ArrayList<>();
        
        // Mock Post 1
        PostDto post1 = new PostDto();
        post1.setId(1L);
        post1.setName("Vehicle Inspection - Honda Civic");
        post1.setContent("Complete inspection required for 2020 Honda Civic");
        post1.setLocation("Los Angeles, CA");
        post1.setOfferAmount("150.00");
        post1.setStatus("ACCEPTED");
        post1.setDealerName("ABC Auto Dealership");
        post1.setVin("1HGBH41JXMN109186");
        post1.setMake("Honda");
        post1.setModel("Civic");
        post1.setYear(2020);
        post1.setCreatedAt(java.time.LocalDateTime.now().minusDays(1).toString());
        post1.setAssignedTechnicianId(technicianId);
        mockPosts.add(post1);
        
        // Mock Post 2
        PostDto post2 = new PostDto();
        post2.setId(2L);
        post2.setName("Pre-Sale Inspection - Toyota Camry");
        post2.setContent("Pre-sale inspection for certified pre-owned vehicle");
        post2.setLocation("San Diego, CA");
        post2.setOfferAmount("200.00");
        post2.setStatus("IN_PROGRESS");
        post2.setDealerName("XYZ Motors");
        post2.setVin("4T1BF1FK5CU123456");
        post2.setMake("Toyota");
        post2.setModel("Camry");
        post2.setYear(2019);
        post2.setCreatedAt(java.time.LocalDateTime.now().minusDays(2).toString());
        post2.setAssignedTechnicianId(technicianId);
        mockPosts.add(post2);
        
        // Mock Post 3
        PostDto post3 = new PostDto();
        post3.setId(3L);
        post3.setName("Insurance Inspection - Ford F-150");
        post3.setContent("Insurance claim inspection for damaged pickup truck");
        post3.setLocation("Phoenix, AZ");
        post3.setOfferAmount("300.00");
        post3.setStatus("PENDING");
        post3.setDealerName("Desert Auto Sales");
        post3.setVin("1FTFW1ET5DFC12345");
        post3.setMake("Ford");
        post3.setModel("F-150");
        post3.setYear(2021);
        post3.setCreatedAt(java.time.LocalDateTime.now().minusHours(6).toString());
        post3.setAssignedTechnicianId(technicianId);
        mockPosts.add(post3);
        
        log.info("Created {} mock assigned posts for technician: {}", mockPosts.size(), technicianId);
        return mockPosts;
    }

    // ==================== CUSTOM EXCEPTION ====================

    /**
     * Custom exception for service communication errors
     */
    public static class ServiceCommunicationException extends RuntimeException {
        public ServiceCommunicationException(String message) {
            super(message);
        }

        public ServiceCommunicationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
