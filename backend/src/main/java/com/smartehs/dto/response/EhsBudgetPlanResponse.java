package com.smartehs.dto.response;

import com.smartehs.model.EhsBudgetPlan;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsBudgetPlanResponse {
    private Long id;
    private Integer budgetYear;
    private String category;
    private String itemName;
    private Long planAmount;
    private String note;
    private String writer;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EhsBudgetPlanResponse from(EhsBudgetPlan entity) {
        return EhsBudgetPlanResponse.builder()
                .id(entity.getId())
                .budgetYear(entity.getBudgetYear())
                .category(entity.getCategory())
                .itemName(entity.getItemName())
                .planAmount(entity.getPlanAmount())
                .note(entity.getNote())
                .writer(entity.getWriter())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
