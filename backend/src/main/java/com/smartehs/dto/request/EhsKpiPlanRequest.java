package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsKpiPlanRequest {

    @NotBlank(message = "Indicator name is required")
    private String indicatorName;

    @NotBlank(message = "Indicator type is required")
    private String indicatorType;

    private Integer planYear;
    private String description;
    private String department;
    private String responsiblePerson;
    private String measurementPeriod;
    private String unit;
    private BigDecimal targetValue;
    private BigDecimal currentValue;
    private BigDecimal achievementRate;
    private String status;
    private String startDate;
    private String endDate;
    private String notes;
}
