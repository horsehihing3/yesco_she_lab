package com.smartehs.dto.response;

import com.smartehs.model.Chemical;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalResponse {
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static ChemicalResponse from(Chemical entity) {
        return ChemicalResponse.builder()
                .id(entity.getId())
                .chemicalId(entity.getChemicalId())
                .chemicalNameKo(entity.getChemicalNameKo())
                .chemicalNameEn(entity.getChemicalNameEn())
                .casNumber(entity.getCasNumber())
                .hazardClass(entity.getHazardClass())
                .status(entity.getStatus())
                .msdsFileId(entity.getMsdsFileId())
                .storageLocation(entity.getStorageLocation())
                .storageQuantity(entity.getStorageQuantity())
                .unit(entity.getUnit())
                .maxStorageLimit(entity.getMaxStorageLimit())
                .supplier(entity.getSupplier())
                .department(entity.getDepartment())
                .handlerName(entity.getHandlerName())
                .emergencyProcedure(entity.getEmergencyProcedure())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .ghsPictogram(entity.getGhsPictogram())
                .signalWord(entity.getSignalWord())
                .hazardStatements(entity.getHazardStatements())
                .precautionaryStatements(entity.getPrecautionaryStatements())
                .molecularFormula(entity.getMolecularFormula())
                .applicableRegulation(entity.getApplicableRegulation())
                .ghsClassification(entity.getGhsClassification())
                .exposureLimit(entity.getExposureLimit())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
