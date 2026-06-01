package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WasteManage {
    private Long id;
    private String wasteCode;
    private String wasteType;
    private String wasteName;
    private String wasteCategory;
    private BigDecimal generationAmount;
    private String unit;
    private LocalDate generationDate;
    private String department;
    private String storageLocation;
    private String status;
    private String disposalMethod;
    private String disposalCompany;
    private LocalDate disposalDate;
    private String vehicleNumber;
    private String disposalNotes;
    private BigDecimal disposalCost;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
