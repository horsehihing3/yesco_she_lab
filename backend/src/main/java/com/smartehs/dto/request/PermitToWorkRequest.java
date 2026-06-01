package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermitToWorkRequest {
    @NotBlank
    private String permitType;
    @NotBlank
    private String riskLevel;
    private String status;
    @NotBlank
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
    private String safetyMeasures;
    private String requiredPpe;
    private String hazardFactors;
    private String emergencyContact;
    private Integer workersCount;
    private String rejectionReason;
    private String notes;
    private Long checklistTemplateId;
    private String inspectorName;
    private Boolean isExternal;
    private Long planApproverUserId;
    private String planApproverTeam;
    private String planApproverPosition;
    private String planApproverName;
    private Long completionApproverUserId;
    private String completionApproverTeam;
    private String completionApproverPosition;
    private String completionApproverName;
}
