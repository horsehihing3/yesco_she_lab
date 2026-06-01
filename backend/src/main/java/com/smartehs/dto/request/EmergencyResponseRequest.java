package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyResponseRequest {
    @NotBlank
    private String emergencyType;
    private String status;
    @NotBlank
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
}
