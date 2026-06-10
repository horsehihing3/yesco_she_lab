package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsAnnualPlanRequest {
    @NotNull(message = "Plan year is required")
    private Integer planYear;
    @NotBlank(message = "Plan name is required")
    private String planName;
    @NotBlank(message = "Description is required")
    private String description;
    private String status;
    private String priority;
    private String remarks;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    // 수정자 (컨트롤러에서 인증된 사용자로 자동 채움)
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    // 계획 승인자 (필수)
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    @NotBlank(message = "Plan approver name is required")
    private String planApproverName;

    // 완료 승인자 (필수)
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    @NotBlank(message = "Completion approver name is required")
    private String completionApproverName;

    private List<GoalRow> goals;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
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
    }
}
