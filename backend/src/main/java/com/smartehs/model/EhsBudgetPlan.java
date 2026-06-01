package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsBudgetPlan {
    private Long id;
    private Integer budgetYear;
    private String category;
    private String itemName;
    private Long planAmount;
    private String note;
    private String writer;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
