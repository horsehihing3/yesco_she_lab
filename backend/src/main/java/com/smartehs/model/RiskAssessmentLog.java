package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentLog {
    private Long id;
    private Long assessmentId;
    private String riskId;
    private String action;
    private String changedBy;
    private String actorRole;
    private String detail;
    private String fieldChanges;
    private String rejectReason;
    private LocalDateTime createdAt;
}
