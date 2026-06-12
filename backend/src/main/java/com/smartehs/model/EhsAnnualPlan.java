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

    // 사람 필드 — JSON 1컬럼(PersonRefTypeHandler). 화면 표시는 팀 / 성명 직위.
    private PersonRef createdBy;          // created_by
    private PersonRef modifiedBy;         // modified_by
    private PersonRef planApprover;       // plan_approver
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    private PersonRef completionApprover; // completion_approver
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private Boolean isApproved;

    private String rejectReason;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<EhsAnnualPlanGoal> goals;
}
