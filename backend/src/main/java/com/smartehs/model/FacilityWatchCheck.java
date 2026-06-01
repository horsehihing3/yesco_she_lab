package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityWatchCheck {
    private Long id;
    private Long watchId;
    private String facilityName;
    private String facilityType;
    private String riskGrade;
    private LocalDate checkDate;
    private String content;
    private String checker;
    private String anomaly;
    private String action;
    private LocalDate nextCheckDate;
    private String riskChange;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
