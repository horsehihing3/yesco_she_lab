package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalImprovement {
    private Long id;
    private String improvementType;
    private String priority;
    private String title;
    private String baseLaw;
    private String description;
    private String dept;
    private String ownerName;
    private LocalDate targetDate;
    private String source;
    private String colStatus;
    private LocalDate registeredDate;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
