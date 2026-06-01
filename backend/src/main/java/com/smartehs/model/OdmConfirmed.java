package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmConfirmed {
    private Long id;
    private String employeeName;
    private String diseaseName;
    private String hazardFactor;
    private String diagnosisAgency;
    private LocalDate confirmedDate;
    private String claimStatus;
    private String approvalStatus;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
