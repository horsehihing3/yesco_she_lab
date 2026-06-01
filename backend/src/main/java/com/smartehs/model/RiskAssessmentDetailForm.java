package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentDetailForm {
    private Long id;
    private String riskId;
    private Long basicId;
    private Integer riskIdx;
    private String majorCategory;
    private String detailAction;
    private String risk4m;
    private String danger;
    private String expectedDisaster;
    private String target;
    private String currSafetyMeasures;
    private Integer possibility;
    private Integer result;
    private Integer riskScore;
    private String riskGrade;
    private Boolean registStatus;
    private String managePlan;
    private Integer managePossibility;
    private Integer manageResult;
    private Integer manageRiskScore;
    private String manageRiskGrade;
    private Integer sortNo;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
