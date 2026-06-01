package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AirEmissionStandardRequest {
    private String itemName;
    private String unit;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String remark;
}
