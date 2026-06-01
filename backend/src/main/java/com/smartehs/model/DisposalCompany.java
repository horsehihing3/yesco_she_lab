package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisposalCompany {
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
}
