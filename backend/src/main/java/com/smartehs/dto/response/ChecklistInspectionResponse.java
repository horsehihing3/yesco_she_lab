package com.smartehs.dto.response;

import com.smartehs.model.ChecklistInspection;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistInspectionResponse {
    private Long id;
    private Long templateId;
    private Long riskAssessmentId;
    private String templateName;
    private LocalDate inspectionDate;
    private String department;
    private String inspector;
    private String site;
    private String status;
    private String remark;
    private LocalDateTime createdAt;
    private List<ChecklistInspectionResultResponse> results;

    public static ChecklistInspectionResponse from(ChecklistInspection entity) {
        return ChecklistInspectionResponse.builder()
                .id(entity.getId())
                .templateId(entity.getTemplateId())
                .riskAssessmentId(entity.getRiskAssessmentId())
                .inspectionDate(entity.getInspectionDate())
                .department(entity.getDepartment())
                .inspector(entity.getInspector())
                .site(entity.getSite())
                .status(entity.getStatus())
                .remark(entity.getRemark())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
