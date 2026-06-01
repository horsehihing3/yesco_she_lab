package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitReporting {
    private Long id;
    private String reportName;
    private String reportType;
    private String regulatoryBody;
    private String legalBasis;
    private String frequency;
    private LocalDate lastSubmission;
    private LocalDate nextDeadline;
    private String assignee;
    private String status;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
