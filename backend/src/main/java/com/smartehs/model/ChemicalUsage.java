package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalUsage {
    private Long id;
    private LocalDate usageDate;
    private String chemicalName;
    private String department;
    private String purpose;
    private BigDecimal usageQuantity;
    private String unit;
    private String handler;
    private String remainingStock;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
