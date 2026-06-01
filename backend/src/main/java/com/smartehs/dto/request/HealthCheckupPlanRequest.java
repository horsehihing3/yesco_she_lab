package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthCheckupPlanRequest {
    @NotNull(message = "Plan year is required")
    private Integer planYear;

    @NotBlank(message = "Checkup type is required")
    private String checkupType;          // GENERAL / SPECIAL / OCCUPATIONAL

    @NotBlank(message = "Plan name is required")
    private String planName;

    private String targetDept;
    private Integer targetCount;
    private String hazardFactors;
    private String hospital;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private String status;
    private String notes;

    // 계획/완료 승인자
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;

    private String writer;
}
