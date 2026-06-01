package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmSuspect {
    private Long id;
    private String employeeName;
    private String employeeNo;
    private String department;
    private String symptoms;
    private String hazardFactor;
    private LocalDate reportDate;
    private String status;
    private String doctor;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
