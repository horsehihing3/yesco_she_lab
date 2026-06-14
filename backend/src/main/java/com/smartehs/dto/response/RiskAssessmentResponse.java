package com.smartehs.dto.response;

import com.smartehs.model.RiskAssessment;
import com.smartehs.util.MultiLanguageUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentResponse {
    private Long id;
    private Long formId;
    private String formTitle;
    private String riskId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String site;
    private String authorName;
    private String authorTeam;
    private String authorPosition;
    private String authorDept;
    private String authorMail;
    private String approverName;
    private String approverMail;
    // 계획/완료 결재 분리
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private String status;
    private Integer riskRegisterCount;
    private Integer detailCount;
    private Integer officeCount;
    private Integer fieldCount;
    private LocalDateTime completedDate;
    private String rejectReason;
    private Boolean allowResubmit;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private Long officeChecklistId;
    private Long sanupChecklistId;
    private Long jungdaeChecklistId;

    private List<RiskActivityProcessResponse> activityProcesses;
    private List<RiskAssessmentDetailResponse> assessmentDetails;
    private List<RiskRegisterResponse> riskRegisters;

    public static RiskAssessmentResponse from(RiskAssessment entity) {
        return RiskAssessmentResponse.builder()
                .id(entity.getId())
                .formId(entity.getFormId())
                .formTitle(entity.getFormTitle())
                .riskId(entity.getRiskId())
                .title(entity.getTitle())
                .titleEn(entity.getTitleEn())
                .titleZh(entity.getTitleZh())
                .site(entity.getSite())
                .authorName(entity.getAuthorName())
                .authorTeam(entity.getAuthorTeam())
                .authorPosition(entity.getAuthorPosition())
                .authorDept(entity.getAuthorDept())
                .authorMail(entity.getAuthorMail())
                .approverName(entity.getApproverName())
                .approverMail(entity.getApproverMail())
                .planApproverUserId(entity.getPlanApproverUserId())
                .planApproverTeam(entity.getPlanApproverTeam())
                .planApproverPosition(entity.getPlanApproverPosition())
                .planApproverName(entity.getPlanApproverName())
                .planApprovedAt(entity.getPlanApprovedAt())
                .planApprovedBy(entity.getPlanApprovedBy())
                .completionApproverUserId(entity.getCompletionApproverUserId())
                .completionApproverTeam(entity.getCompletionApproverTeam())
                .completionApproverPosition(entity.getCompletionApproverPosition())
                .completionApproverName(entity.getCompletionApproverName())
                .completionApprovedAt(entity.getCompletionApprovedAt())
                .completionApprovedBy(entity.getCompletionApprovedBy())
                .status(entity.getStatus())
                .riskRegisterCount(entity.getRiskRegisterCount())
                .detailCount(entity.getDetailCount())
                .officeCount(entity.getOfficeCount())
                .fieldCount(entity.getFieldCount())
                .completedDate(entity.getCompletedDate())
                .rejectReason(entity.getRejectReason())
                .allowResubmit(entity.getAllowResubmit())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .officeChecklistId(entity.getOfficeChecklistId())
                .sanupChecklistId(entity.getSanupChecklistId())
                .jungdaeChecklistId(entity.getJungdaeChecklistId())
                .build();
    }

    public static RiskAssessmentResponse fromLocalized(RiskAssessment entity) {
        return RiskAssessmentResponse.builder()
                .id(entity.getId())
                .formId(entity.getFormId())
                .formTitle(entity.getFormTitle())
                .riskId(entity.getRiskId())
                .title(MultiLanguageUtil.getLocalizedText(entity.getTitle(), entity.getTitleEn(), entity.getTitleZh()))
                .site(entity.getSite())
                .authorName(entity.getAuthorName())
                .authorTeam(entity.getAuthorTeam())
                .authorPosition(entity.getAuthorPosition())
                .authorDept(entity.getAuthorDept())
                .authorMail(entity.getAuthorMail())
                .approverName(entity.getApproverName())
                .approverMail(entity.getApproverMail())
                .planApproverUserId(entity.getPlanApproverUserId())
                .planApproverTeam(entity.getPlanApproverTeam())
                .planApproverPosition(entity.getPlanApproverPosition())
                .planApproverName(entity.getPlanApproverName())
                .planApprovedAt(entity.getPlanApprovedAt())
                .planApprovedBy(entity.getPlanApprovedBy())
                .completionApproverUserId(entity.getCompletionApproverUserId())
                .completionApproverTeam(entity.getCompletionApproverTeam())
                .completionApproverPosition(entity.getCompletionApproverPosition())
                .completionApproverName(entity.getCompletionApproverName())
                .completionApprovedAt(entity.getCompletionApprovedAt())
                .completionApprovedBy(entity.getCompletionApprovedBy())
                .status(entity.getStatus())
                .riskRegisterCount(entity.getRiskRegisterCount())
                .detailCount(entity.getDetailCount())
                .officeCount(entity.getOfficeCount())
                .fieldCount(entity.getFieldCount())
                .completedDate(entity.getCompletedDate())
                .rejectReason(entity.getRejectReason())
                .allowResubmit(entity.getAllowResubmit())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .officeChecklistId(entity.getOfficeChecklistId())
                .sanupChecklistId(entity.getSanupChecklistId())
                .jungdaeChecklistId(entity.getJungdaeChecklistId())
                .build();
    }
}
