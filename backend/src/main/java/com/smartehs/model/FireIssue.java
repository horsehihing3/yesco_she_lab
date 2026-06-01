package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FireIssue {
    private Long id;
    private String issueNo;
    private String facility;
    private String issueType;
    private LocalDate foundDate;
    private String issueContent;
    private String actionContent;
    private LocalDate dueDate;
    private Integer progressPct;
    private String status;
    private String ownerName;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
