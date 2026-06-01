package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErgonomicsAssessment {
    private Long id;
    private String assessmentId;
    private String assessType;
    private String department;
    private String workProcess;
    private String workDescription;
    private String workerName;
    private String workerId;
    private LocalDate assessDate;
    private String assessorName;
    private BigDecimal score;
    private String riskLevel;
    private String affectedBodyParts;
    private String symptoms;
    private String improvementAction;
    private LocalDate improvementDeadline;
    private String improvementStatus;
    private Long photoFileId;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
