package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 법규 대응 계획 — tb_audit_plan 과 동일 구조의 별도 테이블 (tb_legal_compliance_plan) */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalCompliancePlan {
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
    private Long createdByUserId;
    private String createdByName;
    private String rejectReason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
