package com.auto.technician.dashboard.clients;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.auto.technician.dashboard.dto.FeignEmailRequestDto;
import com.auto.technician.dashboard.dto.TechnicianDto;
import com.auto.technician.dashboard.dto.TechnicianPostsDTO;

// @FeignClient(name = "technician")
@FeignClient(name = "technician", url = "http://localhost:8082/api/technicians")
public interface TechnicianClient {

	@PostMapping("/technician-posts-by-techloc")
	List<TechnicianPostsDTO> getAllPostingsFromPostingsService(@RequestBody FeignEmailRequestDto dto);


    // @PostMapping("/get-technician-by-email")
    @PostMapping("/get-technician-by-email")
    TechnicianDto getTechnicianByEmail(@RequestBody FeignEmailRequestDto request); // ✅ fixed path + DTO
    
    
    // @PostMapping("/get-accepted-posts-by-email")
    @PostMapping("/get-accepted-posts-by-email")
    public List<Long> getAcceptedPostsByEmail(@RequestBody FeignEmailRequestDto dto);
    
    
    
}
