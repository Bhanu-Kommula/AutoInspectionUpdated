package com.auto.tech.client;



import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.auto.tech.dto.FeignEmailRequestDto;

// @FeignClient(name = "technician-dashboard", url = "http://localhost:8083") // ✅ port of tech-dashboard
@FeignClient(name = "tech-dashboard", url = "${gateway.url:http://localhost:8088}/tech-dashboard")
public interface TechDashboardFeignClient {

 @PostMapping("/process-accepted-posts")
 ResponseEntity<?> processAndUpdateAcceptedPosts(@RequestBody FeignEmailRequestDto dto);
}