package com.smartehs.dto.response;

import com.smartehs.model.DpCvd;
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
public class DpCvdResponse {
    private Long id;
    private String workerName;
    private String department;
    private Integer age;
    private String gender;
    private BigDecimal bmi;
    private Integer bpSys;
    private Integer bpDia;
    private Integer fastingGlucose;
    private Integer ldl;
    private Integer hdl;
    private String smoking;
    private String drinking;
    private String exercise;
    private String nightShift;
    private String overtime;
    private String riskLevel;
    private LocalDate assessmentDate;
    private String assessor;
    private String managementPlan;
    private LocalDate nextCheckup;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpCvdResponse from(DpCvd e) {
        return DpCvdResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .age(e.getAge())
                .gender(e.getGender())
                .bmi(e.getBmi())
                .bpSys(e.getBpSys())
                .bpDia(e.getBpDia())
                .fastingGlucose(e.getFastingGlucose())
                .ldl(e.getLdl())
                .hdl(e.getHdl())
                .smoking(e.getSmoking())
                .drinking(e.getDrinking())
                .exercise(e.getExercise())
                .nightShift(e.getNightShift())
                .overtime(e.getOvertime())
                .riskLevel(e.getRiskLevel())
                .assessmentDate(e.getAssessmentDate())
                .assessor(e.getAssessor())
                .managementPlan(e.getManagementPlan())
                .nextCheckup(e.getNextCheckup())
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
