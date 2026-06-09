package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupPlan {
    private Long id;
    private Integer planYear;
    private String checkupType;          // GENERAL / SPECIAL / OCCUPATIONAL
    private String planName;
    private String targetDept;
    private Integer targetCount;
    private Integer completedCount;
    private String hazardFactors;
    private String hospital;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private String status;               // PLANNED / PENDING_APPROVAL / IN_PROGRESS / COMPLETED / REJECTED / CANCELLED
    private String notes;
    private String createdBy;
    private String createdByName;
    private String createdByDept;
    private String createdByTeam;
    private String createdByPosition;
    // 수정자
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

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

    private String writer;
    private String rejectReason;
}
