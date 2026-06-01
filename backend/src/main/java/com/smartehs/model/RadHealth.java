package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadHealth {
    private Long id;
    private String employeeNo;
    private String workerName;
    private String dept;
    private String examType;
    private LocalDate examDate;
    private String examOrg;
    private String judgment;
    private String cbcWbc;
    private String lensCheck;
    private BigDecimal cumulativeDose;
    private String afterAction;
    private LocalDate nextExamDate;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
