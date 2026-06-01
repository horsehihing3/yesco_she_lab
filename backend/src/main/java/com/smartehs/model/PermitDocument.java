package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitDocument {
    private Long id;
    private String docName;
    private String docType;
    private String category;
    private String relatedPermit;
    private LocalDate issueDate;
    private Integer retentionYears;
    private String fileLocation;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
