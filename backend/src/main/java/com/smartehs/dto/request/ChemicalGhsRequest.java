package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalGhsRequest {
    @NotBlank private String chemicalName;
    private String casNumber;
    private String physicalHazard;
    private String healthHazard;
    private String environmentalHazard;
    private String signalWord;
    private String ghsVersion;
    private String status;
}
