package com.smartehs.dto.response;

import com.smartehs.model.ChecklistTemplate;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplateResponse {
    private Long id;
    private String templateName;
    private String description;
    private String categoryType;
    private String note;
    private String resultOptions;
    private Integer sortOrder;
    private Boolean isActive;
    private String inspectorName;
    private String inspectorSign;
    private String inspectorSignDate;
    private String reviewerName;
    private String reviewerSign;
    private String reviewerSignDate;
    private String approverName;
    private String approverSign;
    private String approverSignDate;
    private Integer itemCount;
    private LocalDateTime createdAt;
    private List<ChecklistCategoryResponse> categories;

    public static ChecklistTemplateResponse from(ChecklistTemplate entity) {
        return ChecklistTemplateResponse.builder()
                .id(entity.getId())
                .templateName(entity.getTemplateName())
                .description(entity.getDescription())
                .categoryType(entity.getCategoryType())
                .note(entity.getNote())
                .resultOptions(entity.getResultOptions())
                .sortOrder(entity.getSortOrder())
                .isActive(entity.getIsActive())
                .inspectorName(entity.getInspectorName())
                .inspectorSign(entity.getInspectorSign())
                .inspectorSignDate(entity.getInspectorSignDate())
                .reviewerName(entity.getReviewerName())
                .reviewerSign(entity.getReviewerSign())
                .reviewerSignDate(entity.getReviewerSignDate())
                .approverName(entity.getApproverName())
                .approverSign(entity.getApproverSign())
                .approverSignDate(entity.getApproverSignDate())
                .itemCount(entity.getItemCount())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
