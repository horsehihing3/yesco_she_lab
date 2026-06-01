package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalVendor {
    private Long id;
    private String vendorCode;
    private String vendorName;
    private String representative;
    private String contactPerson;
    private String phone;
    private Integer supplyItemsCount;
    private String msdsStatus;
    private LocalDate lastTransactionDate;
    private String grade;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
