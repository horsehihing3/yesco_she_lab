package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 법규 대응 부적합 — tb_audit_finding 과 동일 구조의 별도 테이블 (tb_legal_compliance_finding) */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalComplianceFinding {
    private Long id;
    private String findingId;
    private Long auditId;       // 실시 (tb_legal_compliance_exec) 의 id
    private String severity;
    private String description;
    private String legalRef;
    private String responsibleName;
    private String responsibleDept;
    private LocalDate dueDate;
    private String status;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
