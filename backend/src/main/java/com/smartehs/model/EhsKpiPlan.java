package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsKpiPlan {
    private Long id;
    private Integer planYear;
    private String indicatorType;
    private String indicatorName;
    private String description;
    private String department;
    private String responsiblePerson;
    private String measurementPeriod;
    private String unit;
    private BigDecimal targetValue;
    private BigDecimal currentValue;
    private BigDecimal achievementRate;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
