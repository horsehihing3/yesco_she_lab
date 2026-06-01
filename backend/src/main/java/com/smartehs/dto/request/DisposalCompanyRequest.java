package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisposalCompanyRequest {
    private String companyName;
    private String companyCode;
    private String businessNumber;
    private String ceoName;
    private String phone;
    private String address;
    private String wasteTypes;
    private String licenseNumber;
    private String licenseExpiry;
    private String rating;
    private String status;
}
