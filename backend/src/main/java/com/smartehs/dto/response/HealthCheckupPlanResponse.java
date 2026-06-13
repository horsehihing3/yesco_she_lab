package com.smartehs.dto.response;

import com.smartehs.model.HealthCheckupPlan;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupPlanResponse {
    private Long id;
    private Integer planYear;
    private String checkupType;
    private String planName;
    private String targetDept;
    private Integer targetCount;
    private Integer completedCount;
    private String hazardFactors;
    private String hospital;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private String status;
    private String notes;
    private String createdBy;
    private String createdByName;
    private String createdByDept;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

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

    private String writer;
    private String rejectReason;

    public static HealthCheckupPlanResponse from(HealthCheckupPlan e) {
        return HealthCheckupPlanResponse.builder()
                .id(e.getId())
                .planYear(e.getPlanYear())
                .checkupType(e.getCheckupType())
                .planName(e.getPlanName())
                .targetDept(e.getTargetDept())
                .targetCount(e.getTargetCount())
                .completedCount(e.getCompletedCount())
                .hazardFactors(e.getHazardFactors())
                .hospital(e.getHospital())
                .planStartDate(e.getPlanStartDate())
                .planEndDate(e.getPlanEndDate())
                .status(e.getStatus())
                .notes(e.getNotes())
                .createdBy(e.getCreatedBy())
                .createdByName(e.getCreatedByName())
                .createdByDept(e.getCreatedByDept())
                .modifiedByUserId(e.getModifiedByUserId())
                .modifiedByName(e.getModifiedByName())
                .modifiedByTeam(e.getModifiedByTeam())
                .modifiedByPosition(e.getModifiedByPosition())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
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
                .writer(e.getWriter())
                .rejectReason(e.getRejectReason())
                .build();
    }
}
