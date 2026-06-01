package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyPlan {
    private Long id;
    private String planId;
    private String planType;
    private String planName;
    private String description;
    private String responseSteps;
    private String responsibleDept;
    private String responsibleName;

    // 훈련 일정
    private LocalDate trainingStartDate;
    private LocalDate trainingEndDate;

    private String resourceIds;
    private Long checklistTemplateId;
    private String notes;

    // 결재 상태 (DRAFT / PENDING_APPROVAL / APPROVED / DONE)
    private String status;

    // 작성자
    private Long writerUserId;
    private String writerTeam;
    private String writerPosition;
    private String writerName;

    // 계획 승인자 (비상계획 탭에서 PENDING_APPROVAL → APPROVED)
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;

    // 완료 승인자 (훈련 관리 탭에서 APPROVED → DONE)
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private Boolean approved; // 호환용: status==DONE 와 동기화
    private String rejectReason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
