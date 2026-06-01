package com.smartehs.dto.response;

import com.smartehs.model.ChecklistResultMaster;
import com.smartehs.model.ChecklistResultItem;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistResultMasterResponse {
    private Long id;
    private String title;
    private LocalDate checkDate;
    private String checker;
    private String checkManager;
    private String facilityManager;
    private Long templateId;
    private String regUser;
    private String modUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<ChecklistResultItem> items;

    public static ChecklistResultMasterResponse from(ChecklistResultMaster entity) {
        return ChecklistResultMasterResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .checkDate(entity.getCheckDate())
                .checker(entity.getChecker())
                .checkManager(entity.getCheckManager())
                .facilityManager(entity.getFacilityManager())
                .templateId(entity.getTemplateId())
                .regUser(entity.getRegUser())
                .modUser(entity.getModUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static ChecklistResultMasterResponse from(ChecklistResultMaster entity, List<ChecklistResultItem> items) {
        ChecklistResultMasterResponse response = from(entity);
        response.setItems(items);
        return response;
    }
}
