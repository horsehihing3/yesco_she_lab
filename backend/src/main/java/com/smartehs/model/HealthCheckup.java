package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckup {
    private Long id;
    private String checkupId;
    private String employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Integer checkupYear;
    private String checkupType;
    private Boolean isTarget;
    private String checkupStatus;
    private LocalDate checkupDate;
    private String hospital;
    private String overallResult;
    private LocalDate nextCheckupDate;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
