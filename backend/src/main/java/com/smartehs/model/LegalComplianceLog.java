package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

/** 법규 대응 변경 이력 — tb_audit_log 와 동일 구조 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalComplianceLog {
    private Long id;
    private Long auditId;       // 실시 (tb_legal_compliance_exec) 의 id
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
