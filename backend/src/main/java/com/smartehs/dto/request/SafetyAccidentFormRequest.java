package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SafetyAccidentFormRequest {
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate surveyDate;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private List<ItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        private Long id;
        private Integer itemNo;
        private String accidentCase;
        private String accidentType;
        private Integer nearMiss;
        private Integer fatalAccident;
        private Integer leaveOver1month;
        private Integer leaveUnder1month;
        private Integer noLeave;
        private String frequency;
        private String processActivity;
        private Integer sortOrder;
    }
}
