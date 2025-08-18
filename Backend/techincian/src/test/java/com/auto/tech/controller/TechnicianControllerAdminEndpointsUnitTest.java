package com.auto.tech.controller;

import com.auto.tech.dto.UpdateTechnicianDto;
import com.auto.tech.model.*;
import com.auto.tech.repository.*;
import com.auto.tech.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TechnicianControllerAdminEndpointsUnitTest {

    @Mock
    private TechnicianService service;

    @Mock
    private CounterOfferService counterOfferService;

    @Mock
    private EnhancedTechnicianFeedService enhancedFeedService;

    @Mock
    private TechnicianAnalyticsService analyticsService;

    @Mock
    private TechnicianRepository repo;

    @Mock
    private AcceptedPostRepository acceptedPostRepo;

    @Mock
    private DeclinedPostsRepository declinedPostsRepo;

    @Mock
    private TechnicianAuditLogRepository auditRepo;

    @Mock
    private CounterOfferRepository counterOfferRepo;

    @InjectMocks
    private TechnicianController controller;

    private Technician testTechnician;
    private TechCounterOffer testCounterOffer;
    private TechAcceptedPost testAcceptedPost;
    private TechDeclinedPosts testDeclinedPost;
    private TechnicianAuditLog testAuditLog;

    @BeforeEach
    void setUp() {
        // Setup test data
        testTechnician = new Technician();
        testTechnician.setId(1L);
        testTechnician.setName("John Doe");
        testTechnician.setEmail("john.doe@test.com");
        testTechnician.setPassword("password123");
        testTechnician.setLocation("New York");
        testTechnician.setZipcode("10001");
        testTechnician.setYearsOfExperience("5");
        testTechnician.setStatus("ACTIVE");
        testTechnician.setCreatedAt(LocalDateTime.now());
        testTechnician.setUpdatedAt(LocalDateTime.now());

        testCounterOffer = TechCounterOffer.builder()
                .id(1L)
                .postId(100L)
                .technicianEmail("john.doe@test.com")
                .originalOfferAmount("100.00")
                .requestedOfferAmount("150.00")
                .technicianLocation("New York")
                .requestedAt(LocalDateTime.now())
                .status(TechCounterOffer.CounterOfferStatus.PENDING)
                .build();

        testAcceptedPost = TechAcceptedPost.builder()
                .id(1L)
                .postId(100L)
                .email("john.doe@test.com")
                .acceptedAt(new Date())
                .createdAt(LocalDateTime.now())
                .build();

        testDeclinedPost = TechDeclinedPosts.builder()
                .id(1L)
                .postId(101L)
                .email("john.doe@test.com")
                .createdAt(LocalDateTime.now())
                .build();

        testAuditLog = TechnicianAuditLog.builder()
                .id(1L)
                .email("john.doe@test.com")
                .fieldName("STATUS_CHANGED")
                .oldValue("ACTIVE")
                .newValue("SUSPENDED")
                .updatedAt(LocalDateTime.now())
                .updatedBy("admin")
                .action("SUSPEND_TECHNICIAN")
                .technicianId(1L)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Test
    void testGetAllTechniciansForAdmin() {
        // Given
        List<Technician> technicians = Arrays.asList(testTechnician);
        Page<Technician> technicianPage = new PageImpl<>(technicians, PageRequest.of(0, 20), 1);
        
        when(repo.findByStatusNot(eq("DELETED"), any(PageRequest.class))).thenReturn(technicianPage);

        // When
        ResponseEntity<?> response = controller.getAllTechniciansForAdmin(0, 20, null, null, null, null);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((List<?>) responseBody.get("technicians")).size());
        assertEquals(0, responseBody.get("currentPage"));
        assertEquals(1, responseBody.get("totalPages"));
        assertEquals(1L, responseBody.get("totalElements"));

        verify(repo).findByStatusNot(eq("DELETED"), any(PageRequest.class));
    }

    @Test
    void testGetTechnicianStatisticsForAdmin() {
        // Given
        when(repo.count()).thenReturn(10L);
        when(repo.countByStatus("ACTIVE")).thenReturn(8L);
        when(repo.countByStatus("SUSPENDED")).thenReturn(1L);
        when(repo.countByStatus("DELETED")).thenReturn(1L);
        when(repo.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(2L);
        when(auditRepo.countByUpdatedAtAfter(any(LocalDateTime.class))).thenReturn(5L);

        // When
        ResponseEntity<?> response = controller.getTechnicianStatisticsForAdmin();

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(10L, responseBody.get("totalTechnicians"));
        assertEquals(8L, responseBody.get("activeTechnicians"));
        assertEquals(1L, responseBody.get("suspendedTechnicians"));
        assertEquals(1L, responseBody.get("deletedTechnicians"));
        assertEquals(2L, responseBody.get("newTechniciansThisMonth"));
        assertEquals(5L, responseBody.get("recentActivityCount"));

        verify(repo).count();
        verify(repo).countByStatus("ACTIVE");
        verify(repo).countByStatus("SUSPENDED");
        verify(repo).countByStatus("DELETED");
    }

    @Test
    void testGetCounterOffersForAdmin() {
        // Given
        List<TechCounterOffer> counterOffers = Arrays.asList(testCounterOffer);
        Page<TechCounterOffer> counterOffersPage = new PageImpl<>(counterOffers, PageRequest.of(0, 20), 1);
        
        when(counterOfferRepo.findAll(any(PageRequest.class))).thenReturn(counterOffersPage);

        // When
        ResponseEntity<?> response = controller.getCounterOffersForAdmin(0, 20, null);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((List<?>) responseBody.get("content")).size());
        assertEquals(0, responseBody.get("currentPage"));
        assertEquals(1, responseBody.get("totalPages"));

        verify(counterOfferRepo).findAll(any(PageRequest.class));
    }

    @Test
    void testGetAcceptedPostsForAdmin() {
        // Given
        List<TechAcceptedPost> acceptedPosts = Arrays.asList(testAcceptedPost);
        Page<TechAcceptedPost> acceptedPostsPage = new PageImpl<>(acceptedPosts, PageRequest.of(0, 20), 1);
        
        when(acceptedPostRepo.findAll(any(PageRequest.class))).thenReturn(acceptedPostsPage);

        // When
        ResponseEntity<?> response = controller.getAcceptedPostsForAdmin(0, 20, null);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((List<?>) responseBody.get("content")).size());
        assertEquals(0, responseBody.get("currentPage"));
        assertEquals(1, responseBody.get("totalPages"));

        verify(acceptedPostRepo).findAll(any(PageRequest.class));
    }

    @Test
    void testGetDeclinedPostsForAdmin() {
        // Given
        List<TechDeclinedPosts> declinedPosts = Arrays.asList(testDeclinedPost);
        Page<TechDeclinedPosts> declinedPostsPage = new PageImpl<>(declinedPosts, PageRequest.of(0, 20), 1);
        
        when(declinedPostsRepo.findAll(any(PageRequest.class))).thenReturn(declinedPostsPage);

        // When
        ResponseEntity<?> response = controller.getDeclinedPostsForAdmin(0, 20, null);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((List<?>) responseBody.get("content")).size());
        assertEquals(0, responseBody.get("currentPage"));
        assertEquals(1, responseBody.get("totalPages"));

        verify(declinedPostsRepo).findAll(any(PageRequest.class));
    }

    @Test
    void testGetAuditLogsForAdmin() {
        // Given
        List<TechnicianAuditLog> auditLogs = Arrays.asList(testAuditLog);
        Page<TechnicianAuditLog> auditLogsPage = new PageImpl<>(auditLogs, PageRequest.of(0, 20), 1);
        
        when(auditRepo.findAll(any(PageRequest.class))).thenReturn(auditLogsPage);

        // When
        ResponseEntity<?> response = controller.getAuditLogsForAdmin(0, 20, null);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((List<?>) responseBody.get("content")).size());
        assertEquals(0, responseBody.get("currentPage"));
        assertEquals(1, responseBody.get("totalPages"));

        verify(auditRepo).findAll(any(PageRequest.class));
    }

    @Test
    void testUpdateTechnicianProfileByAdmin() {
        // Given
        UpdateTechnicianDto updateDto = new UpdateTechnicianDto();
        updateDto.setName("Jane Doe");
        updateDto.setLocation("Los Angeles");
        updateDto.setZipcode("90210");
        updateDto.setYearsOfExperience("7");

        Technician updatedTechnician = new Technician();
        updatedTechnician.setId(testTechnician.getId());
        updatedTechnician.setName("Jane Doe");
        updatedTechnician.setEmail(testTechnician.getEmail());
        updatedTechnician.setPassword(testTechnician.getPassword());
        updatedTechnician.setLocation("Los Angeles");
        updatedTechnician.setZipcode("90210");
        updatedTechnician.setYearsOfExperience("7");
        updatedTechnician.setStatus(testTechnician.getStatus());
        updatedTechnician.setCreatedAt(testTechnician.getCreatedAt());
        updatedTechnician.setUpdatedAt(testTechnician.getUpdatedAt());
        updatedTechnician.setLastActivityAt(testTechnician.getLastActivityAt());

        when(repo.findById(1L)).thenReturn(Optional.of(testTechnician));
        when(repo.save(any(Technician.class))).thenReturn(updatedTechnician);
        when(auditRepo.save(any(TechnicianAuditLog.class))).thenReturn(testAuditLog);

        // When
        ResponseEntity<?> response = controller.updateTechnicianProfileByAdmin(1L, updateDto);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        Technician responseBody = (Technician) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Jane Doe", responseBody.getName());
        assertEquals("Los Angeles", responseBody.getLocation());
        assertEquals("90210", responseBody.getZipcode());

        verify(repo).findById(1L);
        verify(repo).save(any(Technician.class));
        verify(auditRepo).save(any(TechnicianAuditLog.class));
    }

    @Test
    void testDeleteTechnicianByAdmin() {
        // Given
        when(repo.findById(1L)).thenReturn(Optional.of(testTechnician));
        when(repo.save(any(Technician.class))).thenReturn(testTechnician);
        when(auditRepo.save(any(TechnicianAuditLog.class))).thenReturn(testAuditLog);

        // When
        ResponseEntity<?> response = controller.deleteTechnicianByAdmin(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals("Technician marked as deleted successfully", responseBody.get("message"));

        verify(repo).findById(1L);
        verify(repo).save(any(Technician.class));
        verify(auditRepo).save(any(TechnicianAuditLog.class));
    }

    @Test
    void testSuspendTechnicianByAdmin() {
        // Given
        when(repo.findById(1L)).thenReturn(Optional.of(testTechnician));
        when(repo.save(any(Technician.class))).thenReturn(testTechnician);
        when(auditRepo.save(any(TechnicianAuditLog.class))).thenReturn(testAuditLog);

        // When
        ResponseEntity<?> response = controller.suspendTechnicianByAdmin(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals("Technician suspended successfully", responseBody.get("message"));

        verify(repo).findById(1L);
        verify(repo).save(any(Technician.class));
        verify(auditRepo).save(any(TechnicianAuditLog.class));
    }

    @Test
    void testActivateTechnicianByAdmin() {
        // Given
        Technician suspendedTechnician = new Technician();
        suspendedTechnician.setId(testTechnician.getId());
        suspendedTechnician.setName(testTechnician.getName());
        suspendedTechnician.setEmail(testTechnician.getEmail());
        suspendedTechnician.setPassword(testTechnician.getPassword());
        suspendedTechnician.setLocation(testTechnician.getLocation());
        suspendedTechnician.setZipcode(testTechnician.getZipcode());
        suspendedTechnician.setYearsOfExperience(testTechnician.getYearsOfExperience());
        suspendedTechnician.setStatus("SUSPENDED");
        suspendedTechnician.setCreatedAt(testTechnician.getCreatedAt());
        suspendedTechnician.setUpdatedAt(testTechnician.getUpdatedAt());
        suspendedTechnician.setLastActivityAt(testTechnician.getLastActivityAt());

        when(repo.findById(1L)).thenReturn(Optional.of(suspendedTechnician));
        when(repo.save(any(Technician.class))).thenReturn(testTechnician);
        when(auditRepo.save(any(TechnicianAuditLog.class))).thenReturn(testAuditLog);

        // When
        ResponseEntity<?> response = controller.activateTechnicianByAdmin(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals("Technician activated successfully", responseBody.get("message"));

        verify(repo).findById(1L);
        verify(repo).save(any(Technician.class));
        verify(auditRepo).save(any(TechnicianAuditLog.class));
    }

    @Test
    void testGetTechniciansByStatus() {
        // Given
        List<Technician> technicians = Arrays.asList(testTechnician);
        Page<Technician> technicianPage = new PageImpl<>(technicians, PageRequest.of(0, 20), 1);
        
        when(repo.findByStatus(eq("ACTIVE"), any(PageRequest.class))).thenReturn(technicianPage);

        // When
        ResponseEntity<?> response = controller.getTechniciansByStatus("ACTIVE", 0, 20);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((List<?>) responseBody.get("technicians")).size());
        assertEquals("ACTIVE", responseBody.get("status"));

        verify(repo).findByStatus(eq("ACTIVE"), any(PageRequest.class));
    }

    @Test
    void testGetCounterOfferStatisticsForAdmin() {
        // Given
        when(counterOfferRepo.count()).thenReturn(20L);
        when(counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.PENDING)).thenReturn(10L);
        when(counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.ACCEPTED)).thenReturn(5L);
        when(counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.REJECTED)).thenReturn(3L);
        when(counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.WITHDRAWN)).thenReturn(1L);
        when(counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.EXPIRED)).thenReturn(1L);

        // When
        ResponseEntity<?> response = controller.getCounterOfferStatisticsForAdmin();

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(20L, responseBody.get("totalCounterOffers"));
        assertEquals(10L, responseBody.get("pendingCounterOffers"));
        assertEquals(5L, responseBody.get("acceptedCounterOffers"));
        assertEquals(3L, responseBody.get("rejectedCounterOffers"));
        assertEquals(1L, responseBody.get("withdrawnCounterOffers"));
        assertEquals(1L, responseBody.get("expiredCounterOffers"));

        verify(counterOfferRepo).count();
        verify(counterOfferRepo).countByStatus(TechCounterOffer.CounterOfferStatus.PENDING);
        verify(counterOfferRepo).countByStatus(TechCounterOffer.CounterOfferStatus.ACCEPTED);
        verify(counterOfferRepo).countByStatus(TechCounterOffer.CounterOfferStatus.REJECTED);
        verify(counterOfferRepo).countByStatus(TechCounterOffer.CounterOfferStatus.WITHDRAWN);
        verify(counterOfferRepo).countByStatus(TechCounterOffer.CounterOfferStatus.EXPIRED);
    }

    @Test
    void testRestoreTechnicianByAdmin() {
        // Given
        Technician deletedTechnician = new Technician();
        deletedTechnician.setId(testTechnician.getId());
        deletedTechnician.setName(testTechnician.getName());
        deletedTechnician.setEmail(testTechnician.getEmail());
        deletedTechnician.setPassword(testTechnician.getPassword());
        deletedTechnician.setLocation(testTechnician.getLocation());
        deletedTechnician.setZipcode(testTechnician.getZipcode());
        deletedTechnician.setYearsOfExperience(testTechnician.getYearsOfExperience());
        deletedTechnician.setStatus("DELETED");
        deletedTechnician.setCreatedAt(testTechnician.getCreatedAt());
        deletedTechnician.setUpdatedAt(testTechnician.getUpdatedAt());
        deletedTechnician.setLastActivityAt(testTechnician.getLastActivityAt());

        when(repo.findById(1L)).thenReturn(Optional.of(deletedTechnician));
        when(repo.save(any(Technician.class))).thenReturn(testTechnician);
        when(auditRepo.save(any(TechnicianAuditLog.class))).thenReturn(testAuditLog);

        // When
        ResponseEntity<?> response = controller.restoreTechnicianByAdmin(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals("Technician restored successfully", responseBody.get("message"));

        verify(repo).findById(1L);
        verify(repo).save(any(Technician.class));
        verify(auditRepo).save(any(TechnicianAuditLog.class));
    }

    @Test
    void testGetTechnicianDashboardSummaryForAdmin() {
        // Given
        List<TechnicianAuditLog> recentActivity = Arrays.asList(testAuditLog);
        when(repo.count()).thenReturn(10L);
        when(repo.countByStatus("ACTIVE")).thenReturn(8L);
        when(repo.countByStatus("SUSPENDED")).thenReturn(1L);
        when(repo.countByStatus("DELETED")).thenReturn(1L);
        when(auditRepo.findAll()).thenReturn(recentActivity);

        // When
        ResponseEntity<?> response = controller.getTechnicianDashboardSummaryForAdmin();

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals(10L, responseBody.get("totalTechnicians"));
        assertEquals(8L, responseBody.get("activeTechnicians"));
        assertEquals(1L, responseBody.get("suspendedTechnicians"));
        assertEquals(1L, responseBody.get("deletedTechnicians"));
        assertNotNull(responseBody.get("recentActivity"));

        verify(repo).count();
        verify(repo).countByStatus("ACTIVE");
        verify(repo).countByStatus("SUSPENDED");
        verify(repo).countByStatus("DELETED");
        verify(auditRepo).findAll();
    }

    @Test
    void testUpdateTechnicianProfileByAdmin_NotFound() {
        // Given
        when(repo.findById(999L)).thenReturn(Optional.empty());

        UpdateTechnicianDto updateDto = new UpdateTechnicianDto();
        updateDto.setName("Jane Doe");

        // When
        ResponseEntity<?> response = controller.updateTechnicianProfileByAdmin(999L, updateDto);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());

        verify(repo).findById(999L);
        verify(repo, never()).save(any(Technician.class));
    }

    @Test
    void testDeleteTechnicianByAdmin_NotFound() {
        // Given
        when(repo.findById(999L)).thenReturn(Optional.empty());

        // When
        ResponseEntity<?> response = controller.deleteTechnicianByAdmin(999L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());

        verify(repo).findById(999L);
        verify(repo, never()).save(any(Technician.class));
    }

    @Test
    void testRestoreTechnicianByAdmin_NotDeleted() {
        // Given
        when(repo.findById(1L)).thenReturn(Optional.of(testTechnician)); // Status is ACTIVE

        // When
        ResponseEntity<?> response = controller.restoreTechnicianByAdmin(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertFalse((Boolean) responseBody.get("success"));
        assertEquals("Technician is not deleted and cannot be restored", responseBody.get("message"));

        verify(repo).findById(1L);
        verify(repo, never()).save(any(Technician.class));
    }

    @Test
    void testGetCounterOffersForAdmin_InvalidStatus() {
        // When
        ResponseEntity<?> response = controller.getCounterOffersForAdmin(0, 20, "INVALID_STATUS");

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertFalse((Boolean) responseBody.get("success"));
        assertEquals("Invalid status: INVALID_STATUS", responseBody.get("message"));
    }
}
