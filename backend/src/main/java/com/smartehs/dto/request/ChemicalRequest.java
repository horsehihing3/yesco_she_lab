package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalRequest {

    @NotBlank(message = "Chemical name (Korean) is required")
    private String chemicalNameKo;

    private String chemicalNameEn;
    private String casNumber;

    @NotBlank(message = "Hazard class is required")
    private String hazardClass;

    private String status;
    private Long msdsFileId;
    private String storageLocation;
    private BigDecimal storageQuantity;
    private String unit;
    private BigDecimal maxStorageLimit;
    private String supplier;
    private String department;
    private String handlerName;
    private String emergencyProcedure;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private String ghsPictogram;
    private String signalWord;
    private String hazardStatements;
    private String precautionaryStatements;
    private String molecularFormula;
    private String applicableRegulation;
    private String ghsClassification;
    private String exposureLimit;
    private String notes;
}
