package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarbonEmissionRequest {
    private String recordDate;
    private String sourceName;
    private Integer scope;
    private BigDecimal energyUsage;
    private String energyUnit;
    private BigDecimal co2Emission;
    private Long factorId;
    private String manager;
    private String remark;
}
