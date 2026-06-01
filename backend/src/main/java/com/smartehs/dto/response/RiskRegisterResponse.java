package com.smartehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskRegisterResponse {
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
