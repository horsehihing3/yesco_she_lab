package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditFinding {
    private Long id;
    private String findingId;
    private Long auditId;
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
