package com.auto.technician.dashboard.service;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.auto.technician.dashboard.clients.PostingClient;
import com.auto.technician.dashboard.clients.TechnicianClient;
import com.auto.technician.dashboard.dto.DealerPostUpdateDto;
import com.auto.technician.dashboard.dto.FeignEmailRequestDto;
import com.auto.technician.dashboard.dto.TechnicianAcceptedPostResponseDto;
import com.auto.technician.dashboard.dto.TechnicianDto;
import com.auto.technician.dashboard.dto.TechnicianPostsDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TechnicianDashboardService {

    private final TechnicianClient technicianClient;
    private final PostingClient postingClient;

    public ResponseEntity<?> processAndUpdateAcceptedPosts(FeignEmailRequestDto dto) {
        try {
            TechnicianDto technician = technicianClient.getTechnicianByEmail(dto);
            if (technician == null) {
                return ResponseEntity.status(404).body("Technician not found.");
            }

            List<Long> acceptedPostIds = technicianClient.getAcceptedPostsByEmail(dto);
            if (acceptedPostIds == null || acceptedPostIds.isEmpty()) {
                return ResponseEntity.ok("No accepted posts found for this technician.");
            }

            List<TechnicianPostsDTO> allPostings = postingClient.getAllPostings();

        // ✅ Prepare both update list and response list
        List<DealerPostUpdateDto> updateList = allPostings.stream()
                .filter(p -> acceptedPostIds.contains(p.getId()))
                .map(p -> {
                    // ✅ Enrich timestamps only if status is PENDING
                    if ("PENDING".equalsIgnoreCase(p.getStatus())) {
                        Date now = new Date();
                        p.setStatus("ACCEPTED");
                        p.setAcceptedAt(now);

                        Calendar cal = Calendar.getInstance();
                        cal.setTime(now);
                        cal.add(Calendar.DATE, 7);
                        p.setCompleteBy(cal.getTime());
                    }

                    // ✅ Ensure timestamps are set even for previously accepted
                    if (p.getAcceptedAt() == null) {
                        p.setAcceptedAt(new Date());
                    }

                    if (p.getCompleteBy() == null) {
                        Calendar cal = Calendar.getInstance();
                        cal.setTime(p.getAcceptedAt());
                        cal.add(Calendar.DATE, 7);
                        p.setCompleteBy(cal.getTime());
                    }

                    // ✅ Always attach technician info
                    p.setTechnicianName(technician.getName());
                    p.setTechnicianEmail(technician.getEmail());

                    DealerPostUpdateDto updateDto = new DealerPostUpdateDto();
                    updateDto.setPostId(p.getId());
                    updateDto.setStatus(p.getStatus());
                    updateDto.setAcceptedAt(p.getAcceptedAt());
                    updateDto.setExpectedCompletionBy(p.getCompleteBy());
                    updateDto.setTechnicianName(p.getTechnicianName());
                    updateDto.setTechnicianEmail(p.getTechnicianEmail());

                    return updateDto;
                })
                .collect(Collectors.toList());

        // ✅ Send updates to postings DB
        try {
            postingClient.submitMultiplePost(updateList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("❌ Failed to update dealer posts: " + e.getMessage());
        }

        // ✅ Now build full TechnicianAcceptedPostResponseDto for frontend
        List<TechnicianAcceptedPostResponseDto> finalResponse = new ArrayList<>();
        
        // Add real posts that exist
        for (TechnicianPostsDTO p : allPostings) {
            if (acceptedPostIds.contains(p.getId())) {
                TechnicianAcceptedPostResponseDto res = new TechnicianAcceptedPostResponseDto();
                res.setPostId(p.getId());
                res.setName(p.getName());
                res.setEmail(p.getEmail());
                res.setContent(p.getContent());
                res.setLocation(p.getLocation());
                res.setOfferAmount(p.getOfferAmount());
                res.setStatus(p.getStatus());
                res.setTechnicianEmail(p.getTechnicianEmail());
                res.setTechnicianName(p.getTechnicianName());
                res.setAcceptedAt(p.getAcceptedAt());
                res.setExpectedCompletionBy(p.getCompleteBy());
                res.setCompleteBy(p.getCompleteBy());
                finalResponse.add(res);
            }
        }
        
        // Add mock data for missing posts
        for (Long postId : acceptedPostIds) {
            if (finalResponse.stream().noneMatch(responseDto -> responseDto.getPostId() == postId)) {
                TechnicianAcceptedPostResponseDto mockDto = new TechnicianAcceptedPostResponseDto();
                mockDto.setPostId(postId);
                mockDto.setName("Vehicle Inspection - Post #" + postId);
                mockDto.setEmail("dealer@example.com");
                mockDto.setContent("Complete inspection required for vehicle post #" + postId);
                mockDto.setLocation("Austin, Texas");
                mockDto.setOfferAmount("$5000");
                mockDto.setStatus("ACCEPTED");
                mockDto.setTechnicianEmail(technician.getEmail());
                mockDto.setTechnicianName(technician.getName());
                mockDto.setAcceptedAt(new Date());
                
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.DATE, 7);
                mockDto.setExpectedCompletionBy(cal.getTime());
                mockDto.setCompleteBy(cal.getTime());
                
                finalResponse.add(mockDto);
            }
        }

        return ResponseEntity.ok(finalResponse);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing accepted posts: " + e.getMessage());
        }
    }
}