package com.smartehs.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentFormItem {
    private Long id;
    private Long formId;
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
    // 양식 헤더 (배관연구팀 양식 기반)
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
