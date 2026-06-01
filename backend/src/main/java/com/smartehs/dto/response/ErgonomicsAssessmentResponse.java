package com.smartehs.dto.response;

import com.smartehs.model.ErgonomicsAssessment;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErgonomicsAssessmentResponse {
    private Long id;
    private String assessmentId;
    private String assessType;
    private String department;
    private String workProcess;
    private String workDescription;
    private String workerName;
    private String workerId;
    private LocalDate assessDate;
    private String assessorName;
    private BigDecimal score;
    private String riskLevel;
    private String affectedBodyParts;
    private String symptoms;
    private String improvementAction;
    private LocalDate improvementDeadline;
    private String improvementStatus;
    private Long photoFileId;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static ErgonomicsAssessmentResponse from(ErgonomicsAssessment e) {
        return ErgonomicsAssessmentResponse.builder()
                .id(e.getId()).assessmentId(e.getAssessmentId()).assessType(e.getAssessType())
                .department(e.getDepartment()).workProcess(e.getWorkProcess())
                .workDescription(e.getWorkDescription()).workerName(e.getWorkerName())
                .workerId(e.getWorkerId()).assessDate(e.getAssessDate())
                .assessorName(e.getAssessorName()).score(e.getScore()).riskLevel(e.getRiskLevel())
                .affectedBodyParts(e.getAffectedBodyParts()).symptoms(e.getSymptoms())
                .improvementAction(e.getImprovementAction()).improvementDeadline(e.getImprovementDeadline())
                .improvementStatus(e.getImprovementStatus()).photoFileId(e.getPhotoFileId())
                .notes(e.getNotes()).createdAt(e.getCreatedAt()).modifiedAt(e.getModifiedAt())
                .build();
    }
}
