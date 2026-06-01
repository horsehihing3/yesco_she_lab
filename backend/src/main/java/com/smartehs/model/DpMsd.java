package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpMsd {
    private Long id;
    private String workerName;
    private String department;
    private String jobTitle;
    private String taskName;
    private String taskCategory;
    private Integer rebaScore;
    private Integer owasScore;
    private String riskLevel;
    private String affectedBodyParts;
    private String symptoms;
    private LocalDate assessmentDate;
    private String assessor;
    private String status;
    private String actionTaken;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
