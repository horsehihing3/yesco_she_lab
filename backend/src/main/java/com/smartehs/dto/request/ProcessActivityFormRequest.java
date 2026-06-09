package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessActivityFormRequest {
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate creationDate;
    private String teamMembers;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private List<ProcessRequest> processes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessRequest {
        private Long id;                 // 기존 id (없으면 신규)
        private String majorCategory;
        private String middleCategory;
        private String subCategory;
        private Integer sortOrder;
        private List<ItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        private Long id;
        private Integer itemNo;
        private String workContent;
        private Boolean excludeEval;
        private String applicableLaw;
        private Integer sortOrder;
    }
}
