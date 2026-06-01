package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FireReport {
    private Long id;
    private String reportType;
    private String lawBasis;
    private String deadlineText;
    private String targetOrg;
    private LocalDate lastSubmit;
    private LocalDate nextSubmit;
    private String status;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
