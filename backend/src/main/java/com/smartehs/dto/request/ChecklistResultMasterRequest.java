package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistResultMasterRequest {

    @NotBlank(message = "Title is required")
    private String title;
    private String checkDate;
    private String checker;
    private String checkManager;
    private String facilityManager;
    private Long templateId;
    private String regUser;
    private List<ChecklistTemplateMasterRequest.ChecklistItemRequest> items;
}
