package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WemImprovementRequest {
    @NotBlank(message = "Process name is required")
    private String processName;
    @NotBlank(message = "Factor name is required")
    private String factorName;
    private String measuredValue;
    private String exposureStandard;
    private Integer exceedRate;
    private String exceedLevel;
    private String department;
    private LocalDate measurementDate;
    private String measurementAgency;
    private LocalDate deadline;
    private Integer remainingDays;
    private String improvementPlan;
    private String status;
    private LocalDate completionDate;
    private String remarks;
}
