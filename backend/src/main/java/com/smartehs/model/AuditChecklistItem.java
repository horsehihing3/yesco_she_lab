package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditChecklistItem {
    private Long id;
    private Long templateId;
    private String section;
    private String itemText;
    private String legalRef;
    private Boolean isCritical;
    private Integer sortOrder;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
