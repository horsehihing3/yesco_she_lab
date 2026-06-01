package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeDetail {
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
}
