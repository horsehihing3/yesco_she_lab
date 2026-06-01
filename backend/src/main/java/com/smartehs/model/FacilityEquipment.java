package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityEquipment {
    private Long id;
    private String mgmtNo;
    private String name;
    private String category;
    private String spec;
    private String location;
    private LocalDate installDate;
    private String baseLaw;
    private String inspectType;
    private String inspectPeriod;
    private LocalDate lastInspectDate;
    private LocalDate nextInspectDate;
    private String status;
    private Long ownerUserId;
    private String ownerName;
    private String ownerDept;
    private String maker;
    private String makerNo;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
