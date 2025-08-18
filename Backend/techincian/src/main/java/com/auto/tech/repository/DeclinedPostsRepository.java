package com.auto.tech.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auto.tech.model.TechDeclinedPosts;

@Repository
public interface DeclinedPostsRepository extends JpaRepository<TechDeclinedPosts, Long> {
	

	 @Query("SELECT t.postId FROM TechDeclinedPosts t WHERE t.email = :email")
	    List<Long> findAllPostIdsByEmail(@Param("email") String email);
	 
	 // Admin controller methods
	 Page<TechDeclinedPosts> findByEmail(String email, Pageable pageable);
	 
	 // Admin controller method for getting all declined posts with pagination
	 Page<TechDeclinedPosts> findAll(Pageable pageable);
	 
	 @Query("SELECT COUNT(t) FROM TechDeclinedPosts t WHERE t.createdAt > :date")
	 long countByCreatedAtAfter(@Param("date") LocalDateTime date);
	 
	 @Query("SELECT COUNT(t) FROM TechDeclinedPosts t WHERE t.email = :email")
	 long countByEmail(@Param("email") String email);
}
