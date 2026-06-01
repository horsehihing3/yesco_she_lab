package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitInspection {
    private Long id;
    private String inspectionName;
    private String inspectionType;
    private String frequency;
    private String targetFacility;
    private String legalBasis;
    private LocalDate lastDate;
    private LocalDate nextDate;
    private String assignee;
    private String lastResult;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
