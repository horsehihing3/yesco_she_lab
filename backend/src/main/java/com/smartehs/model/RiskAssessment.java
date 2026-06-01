package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {
    private Long id;
    private String riskId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String site;
    private String authorName;
    private String authorDept;
    private String authorMail;
    // 호환용: 기존 단일 결재자
    private String approverName;
    private String approverMail;

    // 계획 승인자 (계획 결재 상신 → 승인) — 계획 탭에서 처리
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private java.time.LocalDateTime planApprovedAt;
    private String planApprovedBy;

    // 완료 승인자 (완료 결재 상신 → 승인) — 관리 탭에서 처리
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private java.time.LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    // status: draft / submitted / approved / completion_submitted / completed / rejected
    private String status;
    private Integer riskRegisterCount;
    private Integer officeCount;
    private Integer fieldCount;
    private LocalDateTime completedDate;
    private String rejectReason;
    private Boolean allowResubmit;
    private Long formId;
    private String formTitle;
    private Integer detailCount;
    // 사무업무 탭 Step 2/3/4 에 연결되는 체크리스트 템플릿 ID (tb_checklist_template.id)
    private Long officeChecklistId;
    private Long sanupChecklistId;
    private Long jungdaeChecklistId;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
