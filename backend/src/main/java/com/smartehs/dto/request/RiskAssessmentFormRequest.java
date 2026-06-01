package com.smartehs.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class RiskAssessmentFormRequest {
    private String title;
    private String description;
    private String regUser;
    private List<RiskAssessmentFormItemRequest> items;

    @Data
    public static class RiskAssessmentFormItemRequest {
        private Integer riskIdx;
        private String detailAction;
        private String risk4M;
        private String danger;
        private String expectedDisaster;
        private String target;
        private String currentSafetyMeasures;
        private Integer possibilityGrade;
        private Integer resultGrade;
        private String reductionMeasures;
        private String improvementManager;
        private String improvementDeadline;
        private Integer improvedPossibilityGrade;
        private Integer improvedResultGrade;
        private String relatedLaw;
        private String remark;
        private String reviewer;
        private String approverName;
        private Integer currentFrequency;
        private Integer currentSeverity;
        private Integer currentRisk;
        private Integer currentGrade;
        private String codeNumber;
        private Integer improvedFrequency;
        private Integer improvedSeverity;
        private Integer improvedRisk;
        private Integer improvedGrade;
    }
}
