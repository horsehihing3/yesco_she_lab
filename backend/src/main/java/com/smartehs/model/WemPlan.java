package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemPlan {
    private Long id;
    private Integer planYear;
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
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
