package com.smartehs.dto.request;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplateBatchSaveRequest {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryData {
        private Long id; // null이면 신규
        private String categoryName;
        private Integer sortOrder;
        private List<ItemData> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemData {
        private Long id; // null이면 신규
        private String classification;
        private String checkItem;
        private String legalBasis;
        private String checkResult;
        private String finding;
        private String actionDeadline;
        private Boolean actionComplete;
        private Integer sortOrder;
    }

    private List<CategoryData> categories;

    // 템플릿 메타데이터
    private String templateName;
    private String description;

    // 서명 정보
    private String inspectorName;
    private String inspectorSign;
    private String inspectorSignDate;
    private String reviewerName;
    private String reviewerSign;
    private String reviewerSignDate;
    private String approverName;
    private String approverSign;
    private String approverSignDate;
}
