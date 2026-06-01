package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyResponse {
    private Long id;
    private String responseId;
    private String emergencyType;
    private String status;
    private String title;
    private String description;
    private String location;
    private LocalDateTime reportedAt;
    private LocalDateTime respondedAt;
    private LocalDateTime resolvedAt;
    private String reporterName;
    private String reporterDept;
    private String commanderName;
    private String commanderDept;
    private Integer casualtiesCount;
    private String damageDescription;
    private String actionsTaken;
    private String lessonsLearned;
    private Boolean drillYn;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
