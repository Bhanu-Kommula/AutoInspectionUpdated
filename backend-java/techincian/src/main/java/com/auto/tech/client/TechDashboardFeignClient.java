package com.auto.tech.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.auto.tech.dto.FeignEmailRequestDto;

@FeignClient(name = "tech-dashboard-service")
public interface TechDashboardFeignClient {

 @PostMapping("/process-accepted-posts")
 ResponseEntity<?> processAndUpdateAcceptedPosts(@RequestBody FeignEmailRequestDto dto);
}