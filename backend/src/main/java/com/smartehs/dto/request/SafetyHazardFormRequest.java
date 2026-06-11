package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SafetyHazardFormRequest {
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate surveyDate;
    private String teamMembers;
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
    }
}
