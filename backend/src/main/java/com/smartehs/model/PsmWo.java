package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsmWo {
    private Long id;
    private String woNo;
    private String woType;
    private String priority;
    private String functionalLocation;
    private String equipmentNo;
    private String equipmentName;
    private String plantCode;
    private String workCenter;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;
    private String managerName;
    private String description;
    private String status;
    private BigDecimal laborCost;
    private BigDecimal materialCost;
    private BigDecimal outsourcingCost;
    private BigDecimal otherCost;
    private String operationsJson;
    private String materialsJson;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
