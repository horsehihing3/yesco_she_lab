package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskActivityProcess {
    private Long id;
    private String riskId;
    private Integer majorCategoryIdx;
    private String majorCategory;
    private String detailAction;
    private String evaluationDate;
    private String evaluator;
    private Boolean isTarget;
    private LocalDateTime createdAt;
}
