package com.smartehs.dto.response;

import com.smartehs.model.DpStress;
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
public class DpStressResponse {
    private Long id;
    private String workerName;
    private String department;
    private Integer physicalEnv;
    private Integer jobDemand;
    private Integer autonomy;
    private Integer relationship;
    private Integer jobInsecurity;
    private Integer systemFairness;
    private Integer reward;
    private Integer workCulture;
    private Integer totalScore;
    private String riskLevel;
    private LocalDate assessmentDate;
    private Boolean hasCounseling;
    private String counselingNotes;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpStressResponse from(DpStress e) {
        return DpStressResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .physicalEnv(e.getPhysicalEnv())
                .jobDemand(e.getJobDemand())
                .autonomy(e.getAutonomy())
                .relationship(e.getRelationship())
                .jobInsecurity(e.getJobInsecurity())
                .systemFairness(e.getSystemFairness())
                .reward(e.getReward())
                .workCulture(e.getWorkCulture())
                .totalScore(e.getTotalScore())
                .riskLevel(e.getRiskLevel())
                .assessmentDate(e.getAssessmentDate())
                .hasCounseling(e.getHasCounseling())
                .counselingNotes(e.getCounselingNotes())
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
