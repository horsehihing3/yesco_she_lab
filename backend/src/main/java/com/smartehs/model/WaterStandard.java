package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterStandard {
    private Long id;
    private String itemName;
    private String unit;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
