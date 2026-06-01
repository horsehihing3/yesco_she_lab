package com.smartehs.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplateItem {
    private Long id;
    private Long masterId;
    private String category;
    private String checkItem;
    private String checkContent;
    private String isNormal;
    private String isAbnormal;
    private String remarks;
    private String checkStandard;
    private String actionTaken;
    private String confirm;
}
