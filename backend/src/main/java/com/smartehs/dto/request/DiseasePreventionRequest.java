package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiseasePreventionRequest {

    @NotBlank(message = "Hazard type is required")
    private String hazardType;

    @NotBlank(message = "Hazard name is required")
    private String hazardName;

    private String description;
    private String affectedArea;
    private Integer affectedWorkers;
    private String riskLevel;
    private String exposureLevel;
    private String preventionMeasure;
    private String responsiblePerson;
    private String responsibleDept;
    private String assessmentDate;
    private String nextAssessment;
    private String status;
    private String notes;
}
