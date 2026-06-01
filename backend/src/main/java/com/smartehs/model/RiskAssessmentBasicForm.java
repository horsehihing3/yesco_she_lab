package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentBasicForm {
    private Long id;
    private String formCategory;
    private Integer formCategoryIdx;
    private Integer sortNo;
    private String danger;
    private String expectedDisaster;
    private String target;
    private String risk4m;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
