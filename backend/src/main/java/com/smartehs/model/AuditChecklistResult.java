package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditChecklistResult {
    private Long id;
    private Long auditId;
    private Long itemId;
    private String checkStatus;
    private String checkedBy;
    private LocalDateTime checkedAt;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    // Join fields from tb_audit_checklist_item
    private String section;
    private String itemText;
    private String legalRef;
    private Boolean isCritical;
    private Integer sortOrder;
}
