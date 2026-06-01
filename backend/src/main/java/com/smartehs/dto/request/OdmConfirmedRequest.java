package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdmConfirmedRequest {
    @NotBlank(message = "Employee name is required")
    private String employeeName;
    private String diseaseName;
    private String hazardFactor;
    private String diagnosisAgency;
    private LocalDate confirmedDate;
    private String claimStatus;
    private String approvalStatus;
    private String remarks;
}
