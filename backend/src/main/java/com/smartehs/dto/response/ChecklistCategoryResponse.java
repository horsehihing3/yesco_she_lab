package com.smartehs.dto.response;

import com.smartehs.model.ChecklistCategory;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistCategoryResponse {
    private Long id;
    private Long templateId;
    private String categoryName;
    private Integer sortOrder;
    private List<ChecklistItemResponse> items;

    public static ChecklistCategoryResponse from(ChecklistCategory entity) {
        return ChecklistCategoryResponse.builder()
                .id(entity.getId())
                .templateId(entity.getTemplateId())
                .categoryName(entity.getCategoryName())
                .sortOrder(entity.getSortOrder())
                .build();
    }
}
