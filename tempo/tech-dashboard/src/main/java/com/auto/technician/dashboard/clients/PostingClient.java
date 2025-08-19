package com.auto.technician.dashboard.clients;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

import com.auto.technician.dashboard.dto.DealerPostUpdateDto;
import com.auto.technician.dashboard.dto.TechnicianPostsDTO;


// @FeignClient(name = "postings")
@FeignClient(name = "tech-dashboard-posting-client", url = "http://localhost:8081")
public interface PostingClient {


   @GetMapping("/post")
   List<TechnicianPostsDTO> getAllPostings();
	
	 
	 
	  // @PostMapping("/update-multiple-acceptedpost-from-Techdash")
	  @PostMapping("/update-multiple-acceptedpost-from-Techdash")
	    public List<DealerPostUpdateDto> submitMultiplePost(@RequestBody List<DealerPostUpdateDto> request) ;
	  

}
