package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiseasePrevention {
    private Long id;
    private String caseId;
    private String hazardType;
    private String hazardName;
    private String description;
    private String affectedArea;
    private Integer affectedWorkers;
    private String riskLevel;
    private String exposureLevel;
    private String preventionMeasure;
    private String responsiblePerson;
    private String responsibleDept;
    private LocalDate assessmentDate;
    private LocalDate nextAssessment;
    private String status;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
