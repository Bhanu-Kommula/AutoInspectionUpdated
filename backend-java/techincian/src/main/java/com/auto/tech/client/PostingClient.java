package com.auto.tech.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.auto.tech.dto.PostingDTO;
import com.auto.tech.dto.PostStatusUpdateRequest;

// @FeignClient(name = "postings")
@FeignClient(name = "postings", url = "${gateway.url:https://api-gateway.onrender.com}/postings")
public interface PostingClient {

    // ✅ Existing - Get all posts
    // @GetMapping("/post")
    @GetMapping("/post")
    List<PostingDTO> getAllPostings();

    // ✅ New - Get a specific post by ID
    // @GetMapping("/post/{id}")
    @GetMapping("/post/{id}")
    PostingDTO getPostById(@PathVariable("id") Long id);
    
    // ✅ New - Update post status to ACCEPTED
    @PostMapping("/posts-update-id")
    String updatePostStatus(@RequestBody PostStatusUpdateRequest request);
    
    // ✅ COUNTER OFFER METHODS - Sync with posts service
    
    /**
     * Submit counter offer to posts service
     * POST /counter-offers
     */
    @PostMapping("/counter-offers")
    Object submitCounterOfferToPostsService(@RequestBody Object counterOfferRequest);
    
    /**
     * Get counter offers for a post from posts service
     * GET /counter-offers/post/{postId}
     */
    @GetMapping("/counter-offers/post/{postId}")
    Object getCounterOffersFromPostsService(@PathVariable("postId") Long postId);
    
    /**
     * Withdraw counter offers for a post by technician
     * POST /counter-offers/withdraw
     */
    @PostMapping("/counter-offers/withdraw")
    Object withdrawCounterOffersForPost(@RequestBody Object withdrawalRequest);
}