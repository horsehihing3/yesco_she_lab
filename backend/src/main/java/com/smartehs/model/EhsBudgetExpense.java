package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsBudgetExpense {
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
}
