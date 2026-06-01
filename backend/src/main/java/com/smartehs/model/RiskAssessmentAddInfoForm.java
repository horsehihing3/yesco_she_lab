package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentAddInfoForm {
    private Long id;
    private String riskId;
    private String detailAction;
    private Integer majorCategoryIdx;
    private String majorCategory;
    private String middleCategory;
    private String facility;
    private String frequency;
    private Integer workHours;
    private String worker;
    private String coWorker;
    private LocalDateTime createdAt;
}
