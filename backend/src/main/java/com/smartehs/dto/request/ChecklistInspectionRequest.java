package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistInspectionRequest {
    private Long templateId;
    private Long riskAssessmentId;
    private LocalDate inspectionDate;
    private String department;
    private String inspector;
    private String site;
    private String status;
    private String remark;
    private List<ChecklistInspectionResultRequest> results;
}
