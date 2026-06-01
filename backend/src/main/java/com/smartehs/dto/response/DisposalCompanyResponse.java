package com.smartehs.dto.response;

import com.smartehs.model.DisposalCompany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisposalCompanyResponse {
    private Long id;
    private String companyName;
    private String companyCode;
    private String businessNumber;
    private String ceoName;
    private String phone;
    private String address;
    private String wasteTypes;
    private String licenseNumber;
    private LocalDate licenseExpiry;
    private String rating;
    private String status;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DisposalCompanyResponse from(DisposalCompany entity) {
        return DisposalCompanyResponse.builder()
                .id(entity.getId())
                .companyName(entity.getCompanyName())
                .companyCode(entity.getCompanyCode())
                .businessNumber(entity.getBusinessNumber())
                .ceoName(entity.getCeoName())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .wasteTypes(entity.getWasteTypes())
                .licenseNumber(entity.getLicenseNumber())
                .licenseExpiry(entity.getLicenseExpiry())
                .rating(entity.getRating())
                .status(entity.getStatus())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
