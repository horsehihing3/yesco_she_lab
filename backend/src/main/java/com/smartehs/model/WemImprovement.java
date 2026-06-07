package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemImprovement {
    private Long id;
    private String processName;
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
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
