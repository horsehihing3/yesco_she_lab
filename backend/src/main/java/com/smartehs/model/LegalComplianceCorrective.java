package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 법규 대응 시정조치 — tb_audit_corrective 와 동일 구조의 별도 테이블 (tb_legal_compliance_corrective) */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalComplianceCorrective {
    private Long id;
    private String correctiveId;
    private Long findingId;
    private Long auditId;       // 실시 (tb_legal_compliance_exec) 의 id
    private String auditName;   // JOIN 으로 채워지는 실시명
    private String findingDescription;
    private String severity;
    private String actionDescription;
    private String responsiblePerson;
    private String responsibleDept;
    private LocalDate dueDate;
    private String status;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
