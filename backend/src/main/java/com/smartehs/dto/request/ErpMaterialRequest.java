package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErpMaterialRequest {
    @NotBlank private String materialCode;
    @NotBlank private String materialName;
    private String chemicalName;
    private String casNumber;
    private String supplier;
    private BigDecimal stockQuantity;
    private String unit;
    private BigDecimal unitPrice;
    private LocalDate lastIncomingDate;
    private String status;
}
