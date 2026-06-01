package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalIncomingRequest {
    private LocalDate incomingDate;
    @NotBlank private String chemicalName;
    private String supplier;
    private BigDecimal quantity;
    private String unit;
    private String warehouseCode;
    private String handler;
    private Boolean msdsConfirmed;
}
