package com.smartehs.dto.response;

import com.smartehs.model.ChecklistItem;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemResponse {
    private Long id;
    private Long categoryId;
    private Integer itemNo;
    private String classification;
    private String checkItem;
    private String legalBasis;
    private String checkResult;
    private String finding;
    private String actionDeadline;
    private Boolean actionComplete;
    private Integer sortOrder;

    public static ChecklistItemResponse from(ChecklistItem entity) {
        return ChecklistItemResponse.builder()
                .id(entity.getId())
                .categoryId(entity.getCategoryId())
                .itemNo(entity.getItemNo())
                .classification(entity.getClassification())
                .checkItem(entity.getCheckItem())
                .legalBasis(entity.getLegalBasis())
                .checkResult(entity.getCheckResult())
                .finding(entity.getFinding())
                .actionDeadline(entity.getActionDeadline())
                .actionComplete(entity.getActionComplete())
                .sortOrder(entity.getSortOrder())
                .build();
    }
}
