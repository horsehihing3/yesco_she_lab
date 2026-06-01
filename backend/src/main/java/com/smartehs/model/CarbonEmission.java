package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonEmission {
    private Long id;
    private LocalDate recordDate;
    private String sourceName;
    private Integer scope;
    private BigDecimal energyUsage;
    private String energyUnit;
    private BigDecimal co2Emission;
    private Long factorId;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
