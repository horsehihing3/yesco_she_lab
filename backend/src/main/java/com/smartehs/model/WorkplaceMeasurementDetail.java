package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkplaceMeasurementDetail {
    private Long id;
    private String measurementId;
    private String hazardousFactor;
    private String hazardousFactorEn;
    private String hazardousFactorZh;
    private String factorType;
    private String workProcess;
    private String measurementValue;
    private String exposureStandard;
    private String unit;
    private BigDecimal resultRatio;
    private String resultStatus;
    private Integer employeeCount;
    private String notes;
    private LocalDateTime createdAt;
}
