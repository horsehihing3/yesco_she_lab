package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalTscaRequest {
    @NotBlank private String chemicalName;
    private String casNumber;
    private String inventoryStatus;
    private String regulationSection;
    private String reportingDuty;
    private String exportToUs;
    private String pmnRequired;
    private String status;
}
