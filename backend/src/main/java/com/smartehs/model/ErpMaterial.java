package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErpMaterial {
    private Long id;
    private String materialCode;
    private String materialName;
    private String chemicalName;
    private String casNumber;
    private String supplier;
    private BigDecimal stockQuantity;
    private String unit;
    private BigDecimal unitPrice;
    private LocalDate lastIncomingDate;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
