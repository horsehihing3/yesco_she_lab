package com.smartehs.dto.response;

import com.smartehs.model.DiseasePrevention;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiseasePreventionResponse {
    private Long id;
    private String caseId;
    private String hazardType;
    private String hazardName;
    private String description;
    private String affectedArea;
    private Integer affectedWorkers;
    private String riskLevel;
    private String exposureLevel;
    private String preventionMeasure;
    private String responsiblePerson;
    private String responsibleDept;
    private LocalDate assessmentDate;
    private LocalDate nextAssessment;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DiseasePreventionResponse from(DiseasePrevention entity) {
        return DiseasePreventionResponse.builder()
                .id(entity.getId())
                .caseId(entity.getCaseId())
                .hazardType(entity.getHazardType())
                .hazardName(entity.getHazardName())
                .description(entity.getDescription())
                .affectedArea(entity.getAffectedArea())
                .affectedWorkers(entity.getAffectedWorkers())
                .riskLevel(entity.getRiskLevel())
                .exposureLevel(entity.getExposureLevel())
                .preventionMeasure(entity.getPreventionMeasure())
                .responsiblePerson(entity.getResponsiblePerson())
                .responsibleDept(entity.getResponsibleDept())
                .assessmentDate(entity.getAssessmentDate())
                .nextAssessment(entity.getNextAssessment())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
