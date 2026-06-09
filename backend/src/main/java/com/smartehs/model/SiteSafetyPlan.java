package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SiteSafetyPlan {
    private Long id;
    private String planId;
    private String planType;        // INTERNAL | PARTNER
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
    private String approverName;

    // 계획 승인자
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;

    // 완료 승인자
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private String repeatType;
    private Integer repeatInterval;
    private String repeatDays;
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
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private Long editingUserId;
    private String editingUserName;
    private LocalDateTime editingStartedAt;
}
