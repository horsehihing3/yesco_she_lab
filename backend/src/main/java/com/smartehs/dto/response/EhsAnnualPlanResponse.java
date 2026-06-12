package com.smartehs.dto.response;

import com.smartehs.model.EhsAnnualPlan;
import com.smartehs.model.EhsAnnualPlanGoal;
import com.smartehs.model.PersonRef;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsAnnualPlanResponse {
    private Long id;
    private Integer planYear;
    private String planName;
    private String description;
    private String status;
    private String priority;
    private String remarks;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

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

    private Boolean isApproved;
    private String rejectReason;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<GoalRow> goals;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GoalRow {
        private Long id;
        private String goalText;
        private String subGoal;
        private String task;
        private String kpi;
        private String prevResult;
        private String targetValue;
        private Long ownerUserId;
        private String ownerTeam;
        private String ownerName;
        private Boolean q1;
        private Boolean q2;
        private Boolean q3;
        private Boolean q4;
        private String q1Status;
        private String q2Status;
        private String q3Status;
        private String q4Status;
        private Integer sortOrder;

        public static GoalRow from(EhsAnnualPlanGoal g) {
            return GoalRow.builder()
                    .id(g.getId())
                    .goalText(g.getGoalText())
                    .subGoal(g.getSubGoal())
                    .task(g.getTask())
                    .kpi(g.getKpi())
                    .prevResult(g.getPrevResult())
                    .targetValue(g.getTargetValue())
                    .ownerUserId(g.getOwnerUserId())
                    .ownerTeam(g.getOwnerTeam())
                    .ownerName(g.getOwnerName())
                    .q1(g.getQ1())
                    .q2(g.getQ2())
                    .q3(g.getQ3())
                    .q4(g.getQ4())
                    .q1Status(g.getQ1Status())
                    .q2Status(g.getQ2Status())
                    .q3Status(g.getQ3Status())
                    .q4Status(g.getQ4Status())
                    .sortOrder(g.getSortOrder())
                    .build();
        }
    }

    public static EhsAnnualPlanResponse from(EhsAnnualPlan entity) {
        List<GoalRow> goalRows = entity.getGoals() == null
                ? Collections.emptyList()
                : entity.getGoals().stream().map(GoalRow::from).collect(Collectors.toList());

        return EhsAnnualPlanResponse.builder()
                .id(entity.getId())
                .planYear(entity.getPlanYear())
                .planName(entity.getPlanName())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .remarks(entity.getRemarks())
                .createdByUserId(PersonRef.userId(entity.getCreatedBy()))
                .createdByName(PersonRef.name(entity.getCreatedBy()))
                .createdByTeam(PersonRef.team(entity.getCreatedBy()))
                .createdByPosition(PersonRef.position(entity.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(entity.getModifiedBy()))
                .modifiedByName(PersonRef.name(entity.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(entity.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(entity.getModifiedBy()))
                .planApproverUserId(PersonRef.userId(entity.getPlanApprover()))
                .planApproverTeam(PersonRef.team(entity.getPlanApprover()))
                .planApproverPosition(PersonRef.position(entity.getPlanApprover()))
                .planApproverName(PersonRef.name(entity.getPlanApprover()))
                .planApprovedAt(entity.getPlanApprovedAt())
                .planApprovedBy(entity.getPlanApprovedBy())
                .completionApproverUserId(PersonRef.userId(entity.getCompletionApprover()))
                .completionApproverTeam(PersonRef.team(entity.getCompletionApprover()))
                .completionApproverPosition(PersonRef.position(entity.getCompletionApprover()))
                .completionApproverName(PersonRef.name(entity.getCompletionApprover()))
                .completionApprovedAt(entity.getCompletionApprovedAt())
                .completionApprovedBy(entity.getCompletionApprovedBy())
                .isApproved(entity.getIsApproved())
                .rejectReason(entity.getRejectReason())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .goals(goalRows)
                .build();
    }
}
