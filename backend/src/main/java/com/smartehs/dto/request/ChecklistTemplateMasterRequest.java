package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistTemplateMasterRequest {

    @NotBlank(message = "Title is required")
    private String title;
    private String checkDate;
    private String checker;
    private String checkManager;
    private String facilityManager;
    private String regUser;
    private List<ChecklistItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChecklistItemRequest {
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
}
