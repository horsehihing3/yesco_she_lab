package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chemical {
    private Long id;
    private String chemicalId;
    private String chemicalNameKo;
    private String chemicalNameEn;
    private String casNumber;
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
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
