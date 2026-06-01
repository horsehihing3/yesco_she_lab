package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalReachRequest {
    @NotBlank private String chemicalName;
    private String casNumber;
    private String registrationNo;
    private String svhc;
    private String authorizationRequired;
    private String restrictionNote;
    private LocalDate registrationDate;
    private String status;
}
