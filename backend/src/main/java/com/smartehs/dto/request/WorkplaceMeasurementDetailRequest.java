package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkplaceMeasurementDetailRequest {

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
}
