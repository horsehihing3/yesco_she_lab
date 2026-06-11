package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeEquipmentRequest {
    @NotBlank
    private String name;
    private String nameEn;
    private String nameZh;
    @NotBlank
    private String category;
    private String categoryEn;
    private String categoryZh;
    private String model;
    private String certification;
    @NotNull
    private Integer stockQuantity;
    private Integer minStock;
    private Integer maxStock;
    private BigDecimal wearRate;
    private LocalDate expiryDate;
    private String inspectCycle;
    private LocalDate lastInspectDate;
    private LocalDate nextInspectDate;
    private String storageLocation;
    private String department;
    private String status;
    private String notes;
    private Boolean isConsumable;
}
