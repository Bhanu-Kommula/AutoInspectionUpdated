package com.auto.postings.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.auto.postings.dto.DealerDTO;
import java.util.Map;

// @FeignClient(name = "dealer")
@FeignClient(name = "dealer", url = "http://localhost:8080")
public interface DealerClient {

    // @PostMapping("/api/dealers/login")
    // DealerDTO getDealer(@RequestBody LoginDealerDto dealerDto);

    @GetMapping("/api/dealers/profile-lite/{email}")
    DealerDTO getDealerProfileLite(@PathVariable("email") String email);
    
    @GetMapping("/api/dealers/profile/{email}")
    Map<String, Object> getDealerProfile(@PathVariable("email") String email);

}
