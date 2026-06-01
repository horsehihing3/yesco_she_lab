package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmExposure {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
