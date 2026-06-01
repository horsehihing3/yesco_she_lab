package com.smartehs.dto.response;

import com.smartehs.model.WasteManage;
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
public class WasteManageResponse {
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

    public static WasteManageResponse from(WasteManage entity) {
        return WasteManageResponse.builder()
                .id(entity.getId())
                .wasteCode(entity.getWasteCode())
                .wasteType(entity.getWasteType())
                .wasteName(entity.getWasteName())
                .wasteCategory(entity.getWasteCategory())
                .generationAmount(entity.getGenerationAmount())
                .unit(entity.getUnit())
                .generationDate(entity.getGenerationDate())
                .department(entity.getDepartment())
                .storageLocation(entity.getStorageLocation())
                .status(entity.getStatus())
                .disposalMethod(entity.getDisposalMethod())
                .disposalCompany(entity.getDisposalCompany())
                .disposalDate(entity.getDisposalDate())
                .vehicleNumber(entity.getVehicleNumber())
                .disposalNotes(entity.getDisposalNotes())
                .disposalCost(entity.getDisposalCost())
                .manager(entity.getManager())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
