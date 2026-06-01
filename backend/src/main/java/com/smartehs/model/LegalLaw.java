package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalLaw {
    private Long id;
    private String category;
    private String lawName;
    private String clause;
    private String amendType;
    private LocalDate promulgateDate;
    private LocalDate enforceDate;
    private String reviewer;
    private LocalDate reviewDueDate;
    private String reviewStatus;
    private String applyYn;
    private String followUpAction;
    private String amendSummary;
    private Boolean urgent;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
