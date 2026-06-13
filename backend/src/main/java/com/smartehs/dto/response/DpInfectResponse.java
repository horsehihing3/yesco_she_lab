package com.smartehs.dto.response;

import com.smartehs.model.DpInfect;
import com.smartehs.model.PersonRef;
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
public class DpInfectResponse {
    private Long id;
    private String workerName;
    private String department;
    private String programType;
    private String diseaseType;
    private LocalDate implDate;
    private String result;
    private String status;
    private LocalDate nextDueDate;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpInfectResponse from(DpInfect e) {
        return DpInfectResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .programType(e.getProgramType())
                .diseaseType(e.getDiseaseType())
                .implDate(e.getImplDate())
                .result(e.getResult())
                .status(e.getStatus())
                .nextDueDate(e.getNextDueDate())
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
