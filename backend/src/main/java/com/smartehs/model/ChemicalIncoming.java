package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalIncoming {
    private Long id;
    private LocalDate incomingDate;
    private String incomingNo;
    private String chemicalName;
    private String supplier;
    private BigDecimal quantity;
    private String unit;
    private String warehouseCode;
    private String handler;
    private Boolean msdsConfirmed;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
