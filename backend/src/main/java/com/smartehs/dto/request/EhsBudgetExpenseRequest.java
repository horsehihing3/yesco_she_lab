package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EhsBudgetExpenseRequest {
    @NotNull(message = "Budget year is required")
    private Integer budgetYear;
    @NotBlank(message = "Category is required")
    private String category;
    @NotBlank(message = "Item name is required")
    private String itemName;
    private Long amount;
    private LocalDate expenseDate;
    private String department;
    private String note;
    private String writer;
}
