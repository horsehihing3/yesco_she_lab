package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpRespi {
    private Long id;
    private String workerName;
    private String department;
    private String exposureType;
    private String exposureSubstance;
    private String exposureLevel;
    private String ppeType;
    private LocalDate fitTestDate;
    private String fitTestResult;
    private BigDecimal pftFvc;
    private BigDecimal pftFev1;
    private String skinCondition;
    private String patchTestResult;
    private String status;
    private LocalDate examDate;
    private String examiner;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
