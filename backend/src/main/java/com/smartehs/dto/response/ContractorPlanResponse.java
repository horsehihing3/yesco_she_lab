package com.smartehs.dto.response;

import com.smartehs.model.ContractorPlan;
import com.smartehs.model.PersonRef;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ContractorPlan raw 엔티티 반환 대체 DTO.
 * 4개 PersonRef(planApprover/completionApprover/createdBy/modifiedBy) → 각 flat 4필드. wire 100% 동일 유지.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorPlanResponse {
    private Long id;
    private String planId;
    private String title;
    private String workType;
    private String riskLevel;
    private String workLocation;
    private Integer workersCount;
    private LocalDate workStartDate;
    private LocalDate workEndDate;
    private String workDescription;
    private String safetyMeasures;
    private String requiredPpe;
    private String hazardFactors;
    private String emergencyContact;
    private String notes;
    private Long checklistTemplateId;
    private String approverName;

    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    private String repeatType;
    private Integer repeatInterval;
    private String repeatDays;
    private String status;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectReason;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private Long editingUserId;
    private String editingUserName;
    private LocalDateTime editingStartedAt;

    // PersonRef → flat
    private Long planApproverUserId;
    private String planApproverName;
    private String planApproverTeam;
    private String planApproverPosition;

    private Long completionApproverUserId;
    private String completionApproverName;
    private String completionApproverTeam;
    private String completionApproverPosition;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    public static ContractorPlanResponse from(ContractorPlan e) {
        return ContractorPlanResponse.builder()
                .id(e.getId())
                .planId(e.getPlanId())
                .title(e.getTitle())
                .workType(e.getWorkType())
                .riskLevel(e.getRiskLevel())
                .workLocation(e.getWorkLocation())
                .workersCount(e.getWorkersCount())
                .workStartDate(e.getWorkStartDate())
                .workEndDate(e.getWorkEndDate())
                .workDescription(e.getWorkDescription())
                .safetyMeasures(e.getSafetyMeasures())
                .requiredPpe(e.getRequiredPpe())
                .hazardFactors(e.getHazardFactors())
                .emergencyContact(e.getEmergencyContact())
                .notes(e.getNotes())
                .checklistTemplateId(e.getChecklistTemplateId())
                .approverName(e.getApproverName())
                .planApprovedAt(e.getPlanApprovedAt())
                .planApprovedBy(e.getPlanApprovedBy())
                .completionApprovedAt(e.getCompletionApprovedAt())
                .completionApprovedBy(e.getCompletionApprovedBy())
                .repeatType(e.getRepeatType())
                .repeatInterval(e.getRepeatInterval())
                .repeatDays(e.getRepeatDays())
                .status(e.getStatus())
                .approvedBy(e.getApprovedBy())
                .approvedAt(e.getApprovedAt())
                .rejectReason(e.getRejectReason())
                .totalChecklist(e.getTotalChecklist())
                .completedChecklist(e.getCompletedChecklist())
                .findingCount(e.getFindingCount())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .editingUserId(e.getEditingUserId())
                .editingUserName(e.getEditingUserName())
                .editingStartedAt(e.getEditingStartedAt())
                .planApproverUserId(PersonRef.userId(e.getPlanApprover()))
                .planApproverName(PersonRef.name(e.getPlanApprover()))
                .planApproverTeam(PersonRef.team(e.getPlanApprover()))
                .planApproverPosition(PersonRef.position(e.getPlanApprover()))
                .completionApproverUserId(PersonRef.userId(e.getCompletionApprover()))
                .completionApproverName(PersonRef.name(e.getCompletionApprover()))
                .completionApproverTeam(PersonRef.team(e.getCompletionApprover()))
                .completionApproverPosition(PersonRef.position(e.getCompletionApprover()))
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(e.getModifiedBy()))
                .modifiedByName(PersonRef.name(e.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(e.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(e.getModifiedBy()))
                .build();
    }
}
