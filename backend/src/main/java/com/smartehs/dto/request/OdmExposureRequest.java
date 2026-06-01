package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdmExposureRequest {
    @NotBlank(message = "Employee name is required")
    private String employeeName;
    private String employeeNo;
    private String department;
    private String hazardFactor;
    private String exposureLevel;
    private String exposureStandard;
    private String exposurePeriod;
    private String riskLevel;
    private Integer exceedCount;
    private Integer exposedWorkers;
    private LocalDate measurementDate;
    private String remarks;
}
