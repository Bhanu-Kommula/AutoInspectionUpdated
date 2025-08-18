package com.auto.postings.dto;

import java.util.Date;

import com.auto.postings.model.PostStatus;

import lombok.Data;

@Data
public class DealerAcceptedPostUpdateFromTechDashDto {

    private long postId;
    private PostStatus status;

    private Date acceptedAt;

    private Date expectedCompletionBy;

    private String technicianName;
    private String technicianEmail;
}
