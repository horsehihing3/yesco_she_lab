package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpCvd {
    private Long id;
    private String workerName;
    private String department;
    private Integer age;
    private String gender;
    private BigDecimal bmi;
    private Integer bpSys;
    private Integer bpDia;
    private Integer fastingGlucose;
    private Integer ldl;
    private Integer hdl;
    private String smoking;
    private String drinking;
    private String exercise;
    private String nightShift;
    private String overtime;
    private String riskLevel;
    private LocalDate assessmentDate;
    private String assessor;
    private String managementPlan;
    private LocalDate nextCheckup;
    private String notes;
    private Boolean deleted;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
