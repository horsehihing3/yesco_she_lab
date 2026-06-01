package com.smartehs.dto.response;

import com.smartehs.model.RiskAssessmentForm;
import com.smartehs.model.RiskAssessmentFormItem;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class RiskAssessmentFormResponse {
    private Long id;
    private String title;
    private String description;
    private String regUser;
    private String modUser;
    private String createdAt;
    private String modifiedAt;
    private Integer itemCount;
    private List<RiskAssessmentFormItemResponse> items;

    @Data
    @Builder
    public static class RiskAssessmentFormItemResponse {
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
        private Integer currentFrequency;
        private Integer currentSeverity;
        private Integer currentRisk;
        private Integer currentGrade;
        private String codeNumber;
        private Integer improvedFrequency;
        private Integer improvedSeverity;
        private Integer improvedRisk;
        private Integer improvedGrade;

        public static RiskAssessmentFormItemResponse from(RiskAssessmentFormItem item) {
            return RiskAssessmentFormItemResponse.builder()
                    .id(item.getId())
                    .formId(item.getFormId())
                    .riskIdx(item.getRiskIdx())
                    .detailAction(item.getDetailAction())
                    .risk4M(item.getRisk4M())
                    .danger(item.getDanger())
                    .expectedDisaster(item.getExpectedDisaster())
                    .target(item.getTarget())
                    .currentSafetyMeasures(item.getCurrentSafetyMeasures())
                    .possibilityGrade(item.getPossibilityGrade())
                    .resultGrade(item.getResultGrade())
                    .reductionMeasures(item.getReductionMeasures())
                    .improvementManager(item.getImprovementManager())
                    .improvementDeadline(item.getImprovementDeadline())
                    .improvedPossibilityGrade(item.getImprovedPossibilityGrade())
                    .improvedResultGrade(item.getImprovedResultGrade())
                    .relatedLaw(item.getRelatedLaw())
                    .remark(item.getRemark())
                    .reviewer(item.getReviewer())
                    .approverName(item.getApproverName())
                    .currentFrequency(item.getCurrentFrequency())
                    .currentSeverity(item.getCurrentSeverity())
                    .currentRisk(item.getCurrentRisk())
                    .currentGrade(item.getCurrentGrade())
                    .codeNumber(item.getCodeNumber())
                    .improvedFrequency(item.getImprovedFrequency())
                    .improvedSeverity(item.getImprovedSeverity())
                    .improvedRisk(item.getImprovedRisk())
                    .improvedGrade(item.getImprovedGrade())
                    .build();
        }
    }

    public static RiskAssessmentFormResponse from(RiskAssessmentForm form) {
        return RiskAssessmentFormResponse.builder()
                .id(form.getId())
                .title(form.getTitle())
                .description(form.getDescription())
                .regUser(form.getRegUser())
                .modUser(form.getModUser())
                .createdAt(form.getCreatedAt() != null ? form.getCreatedAt().toString() : null)
                .modifiedAt(form.getModifiedAt() != null ? form.getModifiedAt().toString() : null)
                .build();
    }

    public static RiskAssessmentFormResponse from(RiskAssessmentForm form, List<RiskAssessmentFormItem> items) {
        RiskAssessmentFormResponse response = from(form);
        if (items != null) {
            response.setItems(items.stream()
                    .map(RiskAssessmentFormItemResponse::from)
                    .collect(Collectors.toList()));
        }
        return response;
    }
}
