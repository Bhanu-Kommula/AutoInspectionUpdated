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
import java.util.HashMap;

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

    @GetMapping("/test-cors")
	public ResponseEntity<Map<String, Object>> testCors() {
		Map<String, Object> response = new HashMap<>();
		response.put("status", "success");
		response.put("message", "Tech Dashboard service CORS test successful");
		response.put("service", "tech-dashboard-service");
		response.put("timestamp", System.currentTimeMillis());
		return ResponseEntity.ok(response);
	}
    
    
}
