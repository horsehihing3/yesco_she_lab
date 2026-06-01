package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityInspection {
    private Long id;
    private Long equipmentId;
    private String inspectNo;
    private String equipmentName;
    private String category;
    private String inspectType;
    private String inspectOrg;
    private LocalDate applyDate;
    private LocalDate inspectDate;
    private String result;
    private LocalDate validUntil;
    private Integer cost;
    private String inspector;
    private String ownerName;
    private String note;
    private String fix;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
