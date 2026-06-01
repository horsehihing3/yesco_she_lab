package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskRegister {
    private Long id;
    private String riskId;
    private Integer registerNum;
    private String categoryNum;
    private String detailAction;
    private String danger;
    private String expectedDisaster;
    private String target;
    private String currSafetyMeasures;
    private String riskGrade;
    private String managePlan;
    private String approval;
    private String approvalMail;
    private String relatedInstructions;
    private LocalDateTime createdAt;
}
