package com.smartehs.dto.response;

import com.smartehs.model.EmergencyResponse;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyResponseResponse {
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EmergencyResponseResponse from(EmergencyResponse e) {
        return EmergencyResponseResponse.builder()
                .id(e.getId()).responseId(e.getResponseId()).emergencyType(e.getEmergencyType())
                .status(e.getStatus()).title(e.getTitle()).description(e.getDescription())
                .location(e.getLocation()).reportedAt(e.getReportedAt())
                .respondedAt(e.getRespondedAt()).resolvedAt(e.getResolvedAt())
                .reporterName(e.getReporterName()).reporterDept(e.getReporterDept())
                .commanderName(e.getCommanderName()).commanderDept(e.getCommanderDept())
                .casualtiesCount(e.getCasualtiesCount()).damageDescription(e.getDamageDescription())
                .actionsTaken(e.getActionsTaken()).lessonsLearned(e.getLessonsLearned())
                .drillYn(e.getDrillYn()).notes(e.getNotes())
                .createdAt(e.getCreatedAt()).modifiedAt(e.getModifiedAt())
                .build();
    }
}
