package com.auto.technician.dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.auto.technician.dashboard.dto.FeignEmailRequestDto;
import com.auto.technician.dashboard.service.TechnicianDashboardService;
import java.util.Map;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/accepted-posts")
@RequiredArgsConstructor
public class TechDashboardController {

	private final TechnicianDashboardService service;
	

    
	@PostMapping("/process")
	public ResponseEntity<?> processAndSaveAcceptedPosts(@RequestBody FeignEmailRequestDto dto) {
	    return service.processAndUpdateAcceptedPosts(dto);
	}
    
    @GetMapping("/test")
	public ResponseEntity<?> testEndpoint() {
	    return ResponseEntity.ok(Map.of(
	        "message", "Tech Dashboard Service is working!",
	        "status", "UP",
	        "timestamp", System.currentTimeMillis()
	    ));
	}
    
    
}
