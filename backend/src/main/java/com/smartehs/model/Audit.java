package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Audit {
    private Long id;
    private String auditId;
    private Long planId;
    private String auditName;
    private String auditType;
    private String targetDept;
    @JsonProperty("auditor")
    private String auditorName;
    private String auditorDept;
    @JsonProperty("auditDate")
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
    // 계획 승인자 (감사 계획 단계에서 지정 — 실시 페이지에서도 표시/편집 가능)
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    // 완료 승인자 (감사 실시 완료 시 승인)
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;
    // 작성자 (감사 실시 등록자, 로그인 사용자 자동 입력)
    private Long createdByUserId;
    private String createdByName;
    // 완료 결재 반려 사유
    private String rejectReason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
