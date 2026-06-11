package com.smartehs.dto.response;

import com.smartehs.model.SafetyAccidentForm;
import com.smartehs.model.SafetyAccidentItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyAccidentFormResponse {
    private Long id;
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate surveyDate;
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<ItemResponse> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemResponse {
        private Long id;
        private Long formId;
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

        public static ItemResponse from(SafetyAccidentItem i) {
            return ItemResponse.builder()
                    .id(i.getId()).formId(i.getFormId())
                    .itemNo(i.getItemNo()).accidentCase(i.getAccidentCase()).accidentType(i.getAccidentType())
                    .nearMiss(i.getNearMiss()).fatalAccident(i.getFatalAccident())
                    .leaveOver1month(i.getLeaveOver1month()).leaveUnder1month(i.getLeaveUnder1month()).noLeave(i.getNoLeave())
                    .frequency(i.getFrequency()).processActivity(i.getProcessActivity())
                    .sortOrder(i.getSortOrder())
                    .build();
        }
    }

    public static SafetyAccidentFormResponse from(SafetyAccidentForm f) {
        return SafetyAccidentFormResponse.builder()
                .id(f.getId()).title(f.getTitle()).description(f.getDescription())
                .divisionName(f.getDivisionName()).departmentName(f.getDepartmentName())
                .evaluator(f.getEvaluator()).surveyDate(f.getSurveyDate())
                .createdByUserId(f.getCreatedByUserId()).createdByName(f.getCreatedByName())
                .modifiedByUserId(f.getModifiedByUserId()).modifiedByName(f.getModifiedByName())
                .createdAt(f.getCreatedAt()).modifiedAt(f.getModifiedAt())
                .build();
    }

    public static SafetyAccidentFormResponse fromWithItems(SafetyAccidentForm f, List<SafetyAccidentItem> items) {
        SafetyAccidentFormResponse r = from(f);
        r.setItems(items == null ? null : items.stream().map(ItemResponse::from).collect(Collectors.toList()));
        return r;
    }
}
