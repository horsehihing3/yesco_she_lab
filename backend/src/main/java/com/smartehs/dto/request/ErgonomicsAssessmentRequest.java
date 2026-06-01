package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErgonomicsAssessmentRequest {
    @NotBlank private String assessType;
    private String department;
    @NotBlank private String workProcess;
    private String workDescription;
    private String workerName;
    private String workerId;
    @NotNull private LocalDate assessDate;
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
}
