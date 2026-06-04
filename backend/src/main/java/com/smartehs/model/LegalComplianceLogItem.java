package com.smartehs.model;

import lombok.*;

/** 법규 대응 변경 이력 항목 — tb_audit_log_item 과 동일 구조 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalComplianceLogItem {
    private Long id;
    private Long logId;
    private String categoryName;
    private Integer itemNo;
    private String classification;
    private String checkItem;
    private String legalBasis;
    private String checkResult;
    private String finding;
    private String actionDeadline;
    private Boolean actionComplete;
}
