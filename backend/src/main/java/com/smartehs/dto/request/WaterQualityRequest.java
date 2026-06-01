package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterQualityRequest {
    private String measurementDate;
    private String measurementPoint;
    private BigDecimal ph;
    private BigDecimal bod;
    private BigDecimal cod;
    private BigDecimal ss;
    private BigDecimal tN;
    private BigDecimal tP;
    private String manager;
    private String remark;
}
