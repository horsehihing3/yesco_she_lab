package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskRegisterRequest {
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
}
