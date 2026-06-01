package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentDetailRequest {
    private Long activityProcessId;
    private Integer riskIdx;
    private String majorCategory;
    private String detailAction;
    private String risk4M;
    private String danger;
    private String expectedDisaster;
    private String target;
    private String currentSafetyMeasures;
    private Integer possibilityGrade;
    private Integer resultGrade;
    private Boolean isRegistered;
    private String reductionMeasures;
    private Integer improvedPossibilityGrade;
    private Integer improvedResultGrade;
}
