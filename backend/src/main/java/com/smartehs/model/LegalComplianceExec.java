package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 법규 대응 실시 — tb_audit 와 동일 구조의 별도 테이블 (tb_legal_compliance_exec) */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalComplianceExec {
    private Long id;
    private String auditId;
    private Long planId;
    private String auditName;
    private String auditType;
    private String targetDept;
    private String targetSite;
    private String auditorName;
    private String auditorDept;
    private LocalDate auditStartDate;
    private LocalDate auditEndDate;
    private String grade;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    private String status;
    private String summary;
    private String notes;
    private String modifiedBy;
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
