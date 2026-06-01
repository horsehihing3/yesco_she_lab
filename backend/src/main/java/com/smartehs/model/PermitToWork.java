package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermitToWork {
    private Long id;
    private String permitId;
    private String permitType;
    private String riskLevel;
    private String status;
    private String title;
    private String description;
    private String workLocation;
    private LocalDateTime workStartDate;
    private LocalDateTime workEndDate;
    private String requesterName;
    private String requesterDept;
    private String requesterId;
    private String approverName;
    private String approverDept;
    private String approverId;
    private LocalDateTime approvedAt;
    private String safetyMeasures;
    private String requiredPpe;
    private String hazardFactors;
    private String emergencyContact;
    private Integer workersCount;
    private String rejectionReason;
    private LocalDateTime completedAt;
    private String notes;
    private Long checklistTemplateId;
    private String inspectorName;
    private Boolean isExternal;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    private String modifiedBy;
    private Boolean deleted;
    // 계획 / 완료 결재 분리
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
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
