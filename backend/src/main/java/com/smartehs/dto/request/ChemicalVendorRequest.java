package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalVendorRequest {
    @NotBlank private String vendorName;
    private String representative;
    private String contactPerson;
    private String phone;
    private Integer supplyItemsCount;
    private String msdsStatus;
    private LocalDate lastTransactionDate;
    private String grade;
}
