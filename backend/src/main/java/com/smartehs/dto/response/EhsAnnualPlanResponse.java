package com.smartehs.dto.response;

import com.smartehs.model.EhsAnnualPlan;
import com.smartehs.model.EhsAnnualPlanGoal;
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

    private Long writerUserId;
    private String writerTeam;
    private String writerPosition;
    private String writerName;

    private Long modifiedByUserId;
    private String modifiedByName;

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
                .writerUserId(entity.getWriterUserId())
                .writerTeam(entity.getWriterTeam())
                .writerPosition(entity.getWriterPosition())
                .writerName(entity.getWriterName())
                .modifiedByUserId(entity.getModifiedByUserId())
                .modifiedByName(entity.getModifiedByName())
                .planApproverUserId(entity.getPlanApproverUserId())
                .planApproverTeam(entity.getPlanApproverTeam())
                .planApproverPosition(entity.getPlanApproverPosition())
                .planApproverName(entity.getPlanApproverName())
                .planApprovedAt(entity.getPlanApprovedAt())
                .planApprovedBy(entity.getPlanApprovedBy())
                .completionApproverUserId(entity.getCompletionApproverUserId())
                .completionApproverTeam(entity.getCompletionApproverTeam())
                .completionApproverPosition(entity.getCompletionApproverPosition())
                .completionApproverName(entity.getCompletionApproverName())
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
