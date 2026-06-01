package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WasteManageRequest {
    private String wasteCode;
    private String wasteType;
    private String wasteName;
    private String wasteCategory;
    private BigDecimal generationAmount;
    private String unit;
    private String generationDate;
    private String department;
    private String storageLocation;
    private String status;
    private String disposalMethod;
    private String disposalCompany;
    private String disposalDate;
    private String vehicleNumber;
    private String disposalNotes;
    private BigDecimal disposalCost;
    private String manager;
    private String remark;
}
