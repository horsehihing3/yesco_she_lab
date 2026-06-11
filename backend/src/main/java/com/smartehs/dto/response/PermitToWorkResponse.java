package com.smartehs.dto.response;

import com.smartehs.model.PermitToWork;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermitToWorkResponse {
    private Long id;
    private String permitId;
    private String permitType;
    private String riskLevel;
    private String status;
    private String title;
    private String description;
    private String workLocation;
    private LocalDateTime workStartDate;
    private LocalDateTime workEndDate;
    private String requesterName;
    private String requesterDept;
    private String requesterId;
    private String approverName;
    private String approverDept;
    private String approverId;
    private LocalDateTime approvedAt;
    private String safetyMeasures;
    private String requiredPpe;
    private String hazardFactors;
    private String emergencyContact;
    private Integer workersCount;
    private String rejectionReason;
    private LocalDateTime completedAt;
    private String notes;
    private Long checklistTemplateId;
    private String inspectorName;
    private Boolean isExternal;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    private String modifiedBy;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PermitToWorkResponse from(PermitToWork e) {
        return PermitToWorkResponse.builder()
                .id(e.getId()).permitId(e.getPermitId()).permitType(e.getPermitType())
                .riskLevel(e.getRiskLevel()).status(e.getStatus()).title(e.getTitle())
                .description(e.getDescription()).workLocation(e.getWorkLocation())
                .workStartDate(e.getWorkStartDate()).workEndDate(e.getWorkEndDate())
                .requesterName(e.getRequesterName()).requesterDept(e.getRequesterDept())
                .requesterId(e.getRequesterId()).approverName(e.getApproverName())
                .approverDept(e.getApproverDept()).approverId(e.getApproverId())
                .approvedAt(e.getApprovedAt()).safetyMeasures(e.getSafetyMeasures())
                .requiredPpe(e.getRequiredPpe()).hazardFactors(e.getHazardFactors())
                .emergencyContact(e.getEmergencyContact()).workersCount(e.getWorkersCount())
                .rejectionReason(e.getRejectionReason()).completedAt(e.getCompletedAt())
                .notes(e.getNotes()).checklistTemplateId(e.getChecklistTemplateId())
                .inspectorName(e.getInspectorName()).isExternal(e.getIsExternal())
                .totalChecklist(e.getTotalChecklist()).completedChecklist(e.getCompletedChecklist())
                .findingCount(e.getFindingCount()).modifiedBy(e.getModifiedBy())
                .createdByUserId(e.getCreatedByUserId())
                .createdByName(e.getCreatedByName())
                .createdByTeam(e.getCreatedByTeam())
                .createdByPosition(e.getCreatedByPosition())
                .planApproverUserId(e.getPlanApproverUserId())
                .planApproverTeam(e.getPlanApproverTeam())
                .planApproverPosition(e.getPlanApproverPosition())
                .planApproverName(e.getPlanApproverName())
                .planApprovedAt(e.getPlanApprovedAt())
                .planApprovedBy(e.getPlanApprovedBy())
                .completionApproverUserId(e.getCompletionApproverUserId())
                .completionApproverTeam(e.getCompletionApproverTeam())
                .completionApproverPosition(e.getCompletionApproverPosition())
                .completionApproverName(e.getCompletionApproverName())
                .completionApprovedAt(e.getCompletionApprovedAt())
                .completionApprovedBy(e.getCompletionApprovedBy())
                .rejectReason(e.getRejectReason())
                .createdAt(e.getCreatedAt()).modifiedAt(e.getModifiedAt())
                .build();
    }
}
