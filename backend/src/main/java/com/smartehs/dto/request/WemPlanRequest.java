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
public class WemPlanRequest {
    @NotNull(message = "Plan year is required")
    private Integer planYear;
    @NotBlank(message = "Process name is required")
    private String processName;
    private String department;
    private String hazardType;
    private String measurementCycle;
    private LocalDate lastMeasurementDate;
    private LocalDate nextMeasurementDate;
    private String status;
    private String measurementAgency;
    private String agencyCode;
    private String contractPeriod;
    private String remarks;
}
