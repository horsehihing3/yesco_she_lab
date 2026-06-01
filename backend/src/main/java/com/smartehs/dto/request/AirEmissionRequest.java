package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AirEmissionRequest {
    private String measurementDate;
    private String facility;
    private String pollutant;
    private BigDecimal emissionConcentration;
    private String unit;
    private BigDecimal emissionStandard;
    private String compliance;
    private String manager;
    private String remark;
}
