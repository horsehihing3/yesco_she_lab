package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalClpRequest {
    @NotBlank private String chemicalName;
    private String casNumber;
    private String clpClassification;
    private String signalWord;
    private String hCodes;
    private String pCodes;
    private LocalDate lastUpdated;
    private String status;
}
