package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeBudget;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeBudgetResponse {
    private Long id;
    private Integer budgetYear;
    private String department;
    private Long budgetAmount;
    private Long spentAmount;
    private Long remainingAmount;
    private Integer spentRate;       // % (집행율)
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeBudgetResponse from(PpeBudget e) {
        long budget = e.getBudgetAmount() != null ? e.getBudgetAmount() : 0L;
        long spent = e.getSpentAmount() != null ? e.getSpentAmount() : 0L;
        long remain = budget - spent;
        int rate = budget == 0 ? 0 : (int) Math.round((double) spent / budget * 100);

        return PpeBudgetResponse.builder()
                .id(e.getId())
                .budgetYear(e.getBudgetYear())
                .department(e.getDepartment())
                .budgetAmount(budget)
                .spentAmount(spent)
                .remainingAmount(remain)
                .spentRate(rate)
                .note(e.getNote())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(e.getModifiedBy()))
                .modifiedByName(PersonRef.name(e.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(e.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(e.getModifiedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
