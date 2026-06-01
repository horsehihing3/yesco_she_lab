package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeGroupRequest {

    @NotBlank(message = "Group code is required")
    private String groupCode;

    @NotBlank(message = "Group name is required")
    private String groupName;

    private String description;

    private Boolean isActive;

    private Integer sortOrder;
}
