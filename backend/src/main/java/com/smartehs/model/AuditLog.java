package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    private Long id;
    private Long auditId;
    private String action;
    private String changedBy;
    private String detail;
    private Integer totalCount;
    private Integer passCount;
    private Integer failCount;
    private Integer naCount;
    private String fieldChanges;
    private Long approvalId;
    private String rejectReason;
    private String actorRole;
    private LocalDateTime createdAt;
}
