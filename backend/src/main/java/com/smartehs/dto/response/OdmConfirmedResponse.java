package com.smartehs.dto.response;

import com.smartehs.model.OdmConfirmed;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmConfirmedResponse {
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

    public static OdmConfirmedResponse from(OdmConfirmed entity) {
        return OdmConfirmedResponse.builder()
                .id(entity.getId())
                .employeeName(entity.getEmployeeName())
                .diseaseName(entity.getDiseaseName())
                .hazardFactor(entity.getHazardFactor())
                .diagnosisAgency(entity.getDiagnosisAgency())
                .confirmedDate(entity.getConfirmedDate())
                .claimStatus(entity.getClaimStatus())
                .approvalStatus(entity.getApprovalStatus())
                .remarks(entity.getRemarks())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
