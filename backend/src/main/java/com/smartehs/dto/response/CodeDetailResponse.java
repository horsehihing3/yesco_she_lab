package com.smartehs.dto.response;

import com.smartehs.model.CodeDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeDetailResponse {
    private Long id;
    private Long groupId;
    private String code;
    private String codeValue;
    private String codeNameKo;
    private String codeNameEn;
    private String codeNameZh;
    private String descriptionKo;
    private String descriptionEn;
    private String descriptionZh;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static CodeDetailResponse from(CodeDetail entity) {
        return CodeDetailResponse.builder()
                .id(entity.getId())
                .groupId(entity.getGroupId())
                .code(entity.getCode())
                .codeValue(entity.getCodeValue())
                .codeNameKo(entity.getCodeNameKo())
                .codeNameEn(entity.getCodeNameEn())
                .codeNameZh(entity.getCodeNameZh())
                .descriptionKo(entity.getDescriptionKo())
                .descriptionEn(entity.getDescriptionEn())
                .descriptionZh(entity.getDescriptionZh())
                .isActive(entity.getIsActive())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
