package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditPlan {
    private Long id;
    private String planId;
    private String auditName;
    private String auditType;
    private String targetDept;
    private String targetSite;
    private String auditorName;
    private String auditorDept;
    private String personInCharge;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private String purpose;
    private String status;
    private String notes;
    private Long checklistTemplateId;
    private Boolean approved;
    private String approvedBy;
    private LocalDateTime approvedAt;
    // 계획 승인자 (감사 계획 PENDING_APPROVAL → APPROVED)
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    // 완료 승인자 (감사 계획 단계에서 미리 지정 — 감사 실시 완료 시점 결재용)
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;
    private Long createdByUserId;
    private String createdByName;
    private String rejectReason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
