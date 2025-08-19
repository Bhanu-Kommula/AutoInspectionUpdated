package com.auto.postings.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.auto.postings.dto.DealerDTO;

// @FeignClient(name = "dealer")
@FeignClient(name = "dealer", url = "${gateway.url:http://localhost:8088}/dealer")
public interface DealerClient {

    // @PostMapping("/api/dealers/login")
    // DealerDTO getDealer(@RequestBody LoginDealerDto dealerDto);

    @GetMapping("/api/dealers/profile-lite/{email}")
    DealerDTO getDealerProfileLite(@PathVariable("email") String email);

}
