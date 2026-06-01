package com.smartehs.dto.response;

import com.smartehs.model.PpeEquipment;
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
public class PpeEquipmentResponse {
    private Long id;
    private String equipmentId;
    private String name;
    private String nameEn;
    private String nameZh;
    private String category;
    private String categoryEn;
    private String categoryZh;
    private String model;
    private String certification;
    private Integer stockQuantity;
    private Integer minStock;
    private BigDecimal wearRate;
    private LocalDate expiryDate;
    private String inspectCycle;
    private LocalDate lastInspectDate;
    private LocalDate nextInspectDate;
    private String storageLocation;
    private String department;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeEquipmentResponse from(PpeEquipment entity) {
        return PpeEquipmentResponse.builder()
                .id(entity.getId())
                .equipmentId(entity.getEquipmentId())
                .name(entity.getName())
                .nameEn(entity.getNameEn())
                .nameZh(entity.getNameZh())
                .category(entity.getCategory())
                .categoryEn(entity.getCategoryEn())
                .categoryZh(entity.getCategoryZh())
                .model(entity.getModel())
                .certification(entity.getCertification())
                .stockQuantity(entity.getStockQuantity())
                .minStock(entity.getMinStock())
                .wearRate(entity.getWearRate())
                .expiryDate(entity.getExpiryDate())
                .inspectCycle(entity.getInspectCycle())
                .lastInspectDate(entity.getLastInspectDate())
                .nextInspectDate(entity.getNextInspectDate())
                .storageLocation(entity.getStorageLocation())
                .department(entity.getDepartment())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
