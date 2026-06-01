package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class KpiRecord {
    private Long id;
    private String kpiType;
    private Integer recordYear;
    private Integer recordMonth;
    private BigDecimal targetValue;
    private BigDecimal actualValue;
    private String unit;
    private String department;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
