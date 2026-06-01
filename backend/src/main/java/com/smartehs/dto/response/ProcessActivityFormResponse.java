package com.smartehs.dto.response;

import com.smartehs.model.ProcessActivityForm;
import com.smartehs.model.ProcessActivityItem;
import com.smartehs.model.ProcessActivityProcess;
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
public class ProcessActivityFormResponse {
    private Long id;
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate creationDate;
    private String teamMembers;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<ProcessResponse> processes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcessResponse {
        private Long id;
        private Long formId;
        private String majorCategory;
        private String middleCategory;
        private String subCategory;
        private Integer sortOrder;
        private List<ItemResponse> items;

        public static ProcessResponse from(ProcessActivityProcess p, List<ProcessActivityItem> items) {
            return ProcessResponse.builder()
                    .id(p.getId())
                    .formId(p.getFormId())
                    .majorCategory(p.getMajorCategory())
                    .middleCategory(p.getMiddleCategory())
                    .subCategory(p.getSubCategory())
                    .sortOrder(p.getSortOrder())
                    .items(items == null ? null : items.stream().map(ItemResponse::from).collect(Collectors.toList()))
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemResponse {
        private Long id;
        private Long processId;
        private Integer itemNo;
        private String workContent;
        private Boolean excludeEval;
        private String applicableLaw;
        private Integer sortOrder;

        public static ItemResponse from(ProcessActivityItem i) {
            return ItemResponse.builder()
                    .id(i.getId())
                    .processId(i.getProcessId())
                    .itemNo(i.getItemNo())
                    .workContent(i.getWorkContent())
                    .excludeEval(i.getExcludeEval())
                    .applicableLaw(i.getApplicableLaw())
                    .sortOrder(i.getSortOrder())
                    .build();
        }
    }

    public static ProcessActivityFormResponse from(ProcessActivityForm f) {
        return ProcessActivityFormResponse.builder()
                .id(f.getId())
                .title(f.getTitle())
                .description(f.getDescription())
                .divisionName(f.getDivisionName())
                .departmentName(f.getDepartmentName())
                .evaluator(f.getEvaluator())
                .creationDate(f.getCreationDate())
                .teamMembers(f.getTeamMembers())
                .createdAt(f.getCreatedAt())
                .modifiedAt(f.getModifiedAt())
                .build();
    }
}
