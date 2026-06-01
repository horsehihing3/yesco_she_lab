package com.smartehs.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistCategoryRequest {
    private Long templateId;
    private String categoryName;
    private Integer sortOrder;
}
