package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsAnnualPlan {
    private Long id;
    private Integer planYear;
    private String planName;
    private String description;
    private LocalDate revisedDate;
    private String status;
    private String priority;
    private String remarks;

    private Long writerUserId;
    private String writerTeam;
    private String writerPosition;
    private String writerName;

    // 수정자 (마지막으로 수정한 사용자 — 수정 시 자동 갱신)
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    // 계획 승인자 (연간 계획 메뉴에서 PENDING_APPROVAL → APPROVED)
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;

    // 완료 승인자 (KPI현황 메뉴에서 APPROVED → DONE)
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private Boolean isApproved;

    private String rejectReason;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<EhsAnnualPlanGoal> goals;
}
