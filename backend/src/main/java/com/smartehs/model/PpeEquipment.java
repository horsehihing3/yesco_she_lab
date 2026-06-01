package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeEquipment {
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
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
