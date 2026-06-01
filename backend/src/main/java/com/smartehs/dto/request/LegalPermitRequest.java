package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalPermitRequest {
    private String permitType;
    private String category;
    @NotBlank
    private String permitName;
    private String baseLaw;
    private String agency;
    private String permitNo;
    private LocalDate issueDate;
    private LocalDate expireDate;
    private String ownerName;
    private String renewalPeriod;
    private String conditions;
    private String icon;
}
