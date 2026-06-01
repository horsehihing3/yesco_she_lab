package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityWatch {
    private Long id;
    private String name;
    private String facilityType;
    private String riskGrade;
    private String location;
    private Long ownerUserId;
    private String ownerName;
    private String cycle;
    private LocalDate lastCheckDate;
    private LocalDate nextCheckDate;
    private String anomaly;
    private String action;
    private Integer riskPct;
    private String reason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
