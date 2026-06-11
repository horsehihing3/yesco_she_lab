package com.smartehs.dto.response;

import com.smartehs.model.SafetyHazardForm;
import com.smartehs.model.SafetyHazardItem;
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
public class SafetyHazardFormResponse {
    private Long id;
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate surveyDate;
    private String teamMembers;
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
        private String processActivity;
        private String machineName;
        private Integer machineQty;
        private String chemicalName;
        private String chemicalQty;
        private String exposureTime;
        private Boolean workerComp1;
        private Boolean workerComp2;
        private Boolean workerComp3;
        private Boolean workerComp4;
        private Boolean workerComp5;
        private Boolean workerComp6;
        private Boolean shiftWork1;
        private Boolean shiftWork2;
        private Boolean shiftWork3;
        private Boolean heavyLoad1;
        private Boolean heavyLoad2;
        private Boolean heavyLoad3;
        private String permitWork;
        private String specialTraining;
        private Integer sortOrder;

        public static ItemResponse from(SafetyHazardItem i) {
            return ItemResponse.builder()
                    .id(i.getId()).formId(i.getFormId())
                    .processActivity(i.getProcessActivity())
                    .machineName(i.getMachineName()).machineQty(i.getMachineQty())
                    .chemicalName(i.getChemicalName()).chemicalQty(i.getChemicalQty()).exposureTime(i.getExposureTime())
                    .workerComp1(i.getWorkerComp1()).workerComp2(i.getWorkerComp2()).workerComp3(i.getWorkerComp3())
                    .workerComp4(i.getWorkerComp4()).workerComp5(i.getWorkerComp5()).workerComp6(i.getWorkerComp6())
                    .shiftWork1(i.getShiftWork1()).shiftWork2(i.getShiftWork2()).shiftWork3(i.getShiftWork3())
                    .heavyLoad1(i.getHeavyLoad1()).heavyLoad2(i.getHeavyLoad2()).heavyLoad3(i.getHeavyLoad3())
                    .permitWork(i.getPermitWork()).specialTraining(i.getSpecialTraining())
                    .sortOrder(i.getSortOrder())
                    .build();
        }
    }

    public static SafetyHazardFormResponse from(SafetyHazardForm f) {
        return SafetyHazardFormResponse.builder()
                .id(f.getId()).title(f.getTitle()).description(f.getDescription())
                .divisionName(f.getDivisionName()).departmentName(f.getDepartmentName())
                .evaluator(f.getEvaluator()).surveyDate(f.getSurveyDate()).teamMembers(f.getTeamMembers())
                .createdByUserId(f.getCreatedByUserId()).createdByName(f.getCreatedByName())
                .modifiedByUserId(f.getModifiedByUserId()).modifiedByName(f.getModifiedByName())
                .createdAt(f.getCreatedAt()).modifiedAt(f.getModifiedAt())
                .build();
    }

    public static SafetyHazardFormResponse fromWithItems(SafetyHazardForm f, List<SafetyHazardItem> items) {
        SafetyHazardFormResponse r = from(f);
        r.setItems(items == null ? null : items.stream().map(ItemResponse::from).collect(Collectors.toList()));
        return r;
    }
}
