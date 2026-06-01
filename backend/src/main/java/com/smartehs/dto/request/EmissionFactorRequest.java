package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmissionFactorRequest {
    private String energySource;
    private String unit;
    private BigDecimal factorValue;
    private Integer baseYear;
    private String referenceOrg;
    private Integer scope;
    private String remark;
}
