package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmissionSourceRequest {
    private String sourceCode;
    private String sourceName;
    private String sourceType;
    private Integer scope;
    private String location;
    private String status;
    private BigDecimal annualEmission;
    private String remark;
}
