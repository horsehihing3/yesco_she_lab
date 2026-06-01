package com.smartehs.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemRequest {
    private Long categoryId;
    private Integer itemNo;
    private String checkItem;
    private String legalBasis;
    private Integer sortOrder;
}
