package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskActivityProcessRequest {
    private Integer majorCategoryIdx;
    private String majorCategory;
    private String detailAction;
    private String evaluationDate;
    private String evaluator;
    private Boolean isTarget;
}
