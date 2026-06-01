package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterQuality {
    private Long id;
    private LocalDate measurementDate;
    private String measurementPoint;
    private BigDecimal ph;
    private BigDecimal bod;
    private BigDecimal cod;
    private BigDecimal ss;
    private BigDecimal tN;
    private BigDecimal tP;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
