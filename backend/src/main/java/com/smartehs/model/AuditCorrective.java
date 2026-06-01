package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditCorrective {
    private Long id;
    private String correctiveId;
    private Long findingId;
    private Long auditId;
    private String auditName;          // JOIN 으로 채워지는 감사명 (snapshot 아님)
    private String findingDescription;
    private String severity;
    private String actionDescription;
    // 프론트와 동일한 필드명. MyBatis XML 에서 column="responsible_name" 로 매핑.
    private String responsiblePerson;
    private String responsibleDept;
    private LocalDate dueDate;
    private String status;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
