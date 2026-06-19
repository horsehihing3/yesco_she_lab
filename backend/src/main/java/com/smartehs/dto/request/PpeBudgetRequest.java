package com.smartehs.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeBudgetRequest {
    private Integer budgetYear;
    private String department;
    private Long budgetAmount;
    private Long spentAmount;
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
}
