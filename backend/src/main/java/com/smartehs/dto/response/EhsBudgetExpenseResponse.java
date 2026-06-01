package com.smartehs.dto.response;

import com.smartehs.model.EhsBudgetExpense;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsBudgetExpenseResponse {
    private Long id;
    private Integer budgetYear;
    private String category;
    private String itemName;
    private Long amount;
    private LocalDate expenseDate;
    private String department;
    private String note;
    private String writer;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EhsBudgetExpenseResponse from(EhsBudgetExpense entity) {
        return EhsBudgetExpenseResponse.builder()
                .id(entity.getId())
                .budgetYear(entity.getBudgetYear())
                .category(entity.getCategory())
                .itemName(entity.getItemName())
                .amount(entity.getAmount())
                .expenseDate(entity.getExpenseDate())
                .department(entity.getDepartment())
                .note(entity.getNote())
                .writer(entity.getWriter())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
