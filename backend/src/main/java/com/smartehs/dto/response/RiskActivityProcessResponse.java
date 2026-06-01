package com.smartehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskActivityProcessResponse {
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
