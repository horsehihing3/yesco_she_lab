package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditChecklistTemplate {
    private Long id;
    private String templateId;
    private String auditType;
    private String title;
    private String description;
    private Boolean isActive;
    private String content;
    private String inspectionDate;
    private String inspectionLocation;
    private String inspectionDept;
    private String personInCharge;
    private String inspector;
    private String reviewer;
    private String inspectionType;
    private String inspectionCount;
    private String overallResult;
    private String totalScore;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<AuditChecklistItem> items;
}
