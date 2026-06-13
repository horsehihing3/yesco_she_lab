package com.smartehs.dto.response;

import com.smartehs.model.DpRespi;
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
public class DpRespiResponse {
    private Long id;
    private String workerName;
    private String department;
    private String exposureType;
    private String exposureSubstance;
    private String exposureLevel;
    private String ppeType;
    private LocalDate fitTestDate;
    private String fitTestResult;
    private BigDecimal pftFvc;
    private BigDecimal pftFev1;
    private String skinCondition;
    private String patchTestResult;
    private String status;
    private LocalDate examDate;
    private String examiner;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpRespiResponse from(DpRespi e) {
        return DpRespiResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .exposureType(e.getExposureType())
                .exposureSubstance(e.getExposureSubstance())
                .exposureLevel(e.getExposureLevel())
                .ppeType(e.getPpeType())
                .fitTestDate(e.getFitTestDate())
                .fitTestResult(e.getFitTestResult())
                .pftFvc(e.getPftFvc())
                .pftFev1(e.getPftFev1())
                .skinCondition(e.getSkinCondition())
                .patchTestResult(e.getPatchTestResult())
                .status(e.getStatus())
                .examDate(e.getExamDate())
                .examiner(e.getExaminer())
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
