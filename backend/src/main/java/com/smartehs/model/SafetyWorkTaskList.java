package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyWorkTaskList {
    private Long id;
    private String safetyTaskId;
    private String safetyWorkId;
    private LocalDate taskDate;
    private String taskTime;
    private String description;
    private String detail;
    private String comment;
    private Integer workerCount;
    private Integer attendeeCount;
    private Boolean permitStatus;
    private Boolean educationStatus;
    private String authorName;
    private String authorMail;
    private String authorDept;
    private String authorCompany;
    private String status;
    private String rejectComment;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
