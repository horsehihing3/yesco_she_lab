package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorPlan {
    private Long id;
    private String planId;
    private String title;
    private String workType;
    private String riskLevel;
    private String workLocation;
    private Integer workersCount;
    private LocalDate workStartDate;
    private LocalDate workEndDate;
    private String workDescription;
    private String safetyMeasures;
    private String requiredPpe;
    private String hazardFactors;
    private String emergencyContact;
    private String notes;
    private Long checklistTemplateId;
    // 호환용: 기존 단일 결재자 (입력은 더 이상 받지 않음)
    private String approverName;

    // 계획 승인자 (DRAFT/PENDING_APPROVAL → APPROVED) — 계획 등록 탭에서 처리
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;

    // 완료 승인자 (APPROVED → DONE) — 관리 탭에서 처리
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private String repeatType;
    private Integer repeatInterval;
    private String repeatDays;
    // status: DRAFT / PENDING_APPROVAL / APPROVED / DONE / REJECTED
    private String status;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectReason;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    // 작성자
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private String modifiedBy;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private Long modifiedByUserId;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private Long editingUserId;
    private String editingUserName;
    private LocalDateTime editingStartedAt;
}
