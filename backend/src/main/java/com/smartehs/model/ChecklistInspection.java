package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistInspection {
    private Long id;
    private Long templateId;
    private Long riskAssessmentId;
    private LocalDate inspectionDate;
    private String department;
    private String inspector;
    private String site;
    private String status;
    private String remark;
    private String regUser;
    private String modUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
