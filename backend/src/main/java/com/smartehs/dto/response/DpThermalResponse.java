package com.smartehs.dto.response;

import com.smartehs.model.DpThermal;
import com.smartehs.model.PersonRef;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DpThermalResponse {
    private Long id;
    private String thermalType;
    private LocalDate occurDate;
    private String location;
    private String workerName;
    private String department;
    private String weatherCondition;
    private BigDecimal perceivedTemp;
    private String symptoms;
    private String severity;
    private String treatment;
    private String outcome;
    private String preventionAction;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpThermalResponse from(DpThermal e) {
        return DpThermalResponse.builder()
                .id(e.getId())
                .thermalType(e.getThermalType())
                .occurDate(e.getOccurDate())
                .location(e.getLocation())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .weatherCondition(e.getWeatherCondition())
                .perceivedTemp(e.getPerceivedTemp())
                .symptoms(e.getSymptoms())
                .severity(e.getSeverity())
                .treatment(e.getTreatment())
                .outcome(e.getOutcome())
                .preventionAction(e.getPreventionAction())
                .notes(e.getNotes())
                .deleted(e.getDeleted())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
