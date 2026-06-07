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
    // 컨트롤러에서 인증된 사용자로 자동 채움 — 클라이언트 전송 무시
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
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
