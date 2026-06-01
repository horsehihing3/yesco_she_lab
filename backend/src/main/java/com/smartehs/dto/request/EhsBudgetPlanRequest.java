package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsBudgetPlanRequest {
    @NotNull(message = "Budget year is required")
    private Integer budgetYear;
    @NotBlank(message = "Category is required")
    private String category;
    @NotBlank(message = "Item name is required")
    private String itemName;
    private Long planAmount;
    private String note;
    private String writer;
}
