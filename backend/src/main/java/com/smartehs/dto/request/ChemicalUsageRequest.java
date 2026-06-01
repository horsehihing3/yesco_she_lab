package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalUsageRequest {
    private LocalDate usageDate;
    @NotBlank private String chemicalName;
    private String department;
    private String purpose;
    private BigDecimal usageQuantity;
    private String unit;
    private String handler;
    private String remainingStock;
}
