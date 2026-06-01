package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AirEmission {
    private Long id;
    private LocalDate measurementDate;
    private String facility;
    private String pollutant;
    private BigDecimal emissionConcentration;
    private String unit;
    private BigDecimal emissionStandard;
    private String compliance;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
