package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsmData {
    private Long id;
    private String category;        // EQUIP / CHEM / POWER / VESSEL / PIPE / PSV
    private String code;
    private String nameKo;
    private String typeLabel;
    private String location;
    private String manufacturer;
    private LocalDate installDate;
    private String designPressure;
    private String designTemperature;
    private String material;
    private String inspectionCycle;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private String statusCode;
    private String managerName;
    private String notes;

    private String extraA;
    private String extraB;
    private String extraC;

    private String casNumber;
    private String ghsClass;
    private BigDecimal regulatedQtyKg;
    private BigDecimal holdingQtyKg;
    private Boolean psmTarget;

    private String setPressure;
    private String protectedEquip;

    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
