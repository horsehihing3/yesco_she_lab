package com.smartehs.dto.response;

import com.smartehs.model.ChecklistTemplateMaster;
import com.smartehs.model.ChecklistTemplateItem;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplateMasterResponse {
    private Long id;
    private String title;
    private String checkDate;
    private String checker;
    private String checkManager;
    private String facilityManager;
    private String regUser;
    private String modUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<ChecklistTemplateItem> items;

    public static ChecklistTemplateMasterResponse from(ChecklistTemplateMaster entity) {
        return ChecklistTemplateMasterResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .checkDate(entity.getCheckDate())
                .checker(entity.getChecker())
                .checkManager(entity.getCheckManager())
                .facilityManager(entity.getFacilityManager())
                .regUser(entity.getRegUser())
                .modUser(entity.getModUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static ChecklistTemplateMasterResponse from(ChecklistTemplateMaster entity, List<ChecklistTemplateItem> items) {
        ChecklistTemplateMasterResponse response = from(entity);
        response.setItems(items);
        return response;
    }
}
