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
public class RiskAssessmentDetailResponse {
    private Long id;
    private String riskId;
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
    private Integer riskScore;
    private String riskGrade;
    private Boolean isRegistered;
    private String reductionMeasures;
    private Integer improvedPossibilityGrade;
    private Integer improvedResultGrade;
    private Integer improvedRiskScore;
    private String improvedRiskGrade;
    private LocalDateTime createdAt;
}
