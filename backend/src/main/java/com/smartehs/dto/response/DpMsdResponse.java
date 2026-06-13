package com.smartehs.dto.response;

import com.smartehs.model.DpMsd;
import com.smartehs.model.PersonRef;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DpMsd raw 엔티티 반환 대체 DTO. (PersonRef 브릿지 도메인 전환 템플릿)
 *
 * wire(JSON) 는 raw 모델과 100% 동일하게 유지 — 프론트 무변경.
 * PersonRef(@JsonIgnore createdBy)는 flat 4필드(createdByUserId/Name/Team/Position)로
 * 펼쳐서 내보낸다 (모델의 @JsonProperty 브릿지 getter와 동일 키).
 *
 * 다른 Dp·Od 도메인은 이 파일을 복사 후 필드만 교체하면 된다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DpMsdResponse {
    private Long id;
    private String workerName;
    private String department;
    private String jobTitle;
    private String taskName;
    private String taskCategory;
    private Integer rebaScore;
    private Integer owasScore;
    private String riskLevel;
    private String affectedBodyParts;
    private String symptoms;
    private LocalDate assessmentDate;
    private String assessor;
    private String status;
    private String actionTaken;
    private String notes;
    private Boolean deleted;

    // PersonRef(createdBy) → flat (raw 모델의 @JsonProperty 키와 동일)
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpMsdResponse from(DpMsd e) {
        return DpMsdResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .jobTitle(e.getJobTitle())
                .taskName(e.getTaskName())
                .taskCategory(e.getTaskCategory())
                .rebaScore(e.getRebaScore())
                .owasScore(e.getOwasScore())
                .riskLevel(e.getRiskLevel())
                .affectedBodyParts(e.getAffectedBodyParts())
                .symptoms(e.getSymptoms())
                .assessmentDate(e.getAssessmentDate())
                .assessor(e.getAssessor())
                .status(e.getStatus())
                .actionTaken(e.getActionTaken())
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
