package com.smartehs.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorEvalItem {
    private Long id;
    private Long templateId;
    private Integer sortOrder;
    private String workContent;
    private String evalCategory;
    private String riskFactor;
    private String disasterType;
    private Boolean isNa;
    private String currentMeasures;
    private Integer currentFrequency;
    private Integer currentSeverity;
    private Integer currentRisk;
    private String riskGrade;
    private String improvement;
    private String eduFrequency;
    private Integer postFrequency;
    private Integer postSeverity;
    private Integer postRisk;
}
