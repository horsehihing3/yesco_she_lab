package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeDetailRequest {

    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotBlank(message = "Code is required")
    private String code;

    private String codeValue;

    @NotBlank(message = "Korean code name is required")
    private String codeNameKo;

    @NotBlank(message = "English code name is required")
    private String codeNameEn;

    @NotBlank(message = "Chinese code name is required")
    private String codeNameZh;

    private String descriptionKo;
    private String descriptionEn;
    private String descriptionZh;

    private Boolean isActive;

    private Integer sortOrder;
}
