package com.smartehs.dto.response;

import com.smartehs.model.EmissionSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionSourceResponse {
    private Long id;
    private String sourceCode;
    private String sourceName;
    private String sourceType;
    private Integer scope;
    private String location;
    private String status;
    private BigDecimal annualEmission;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EmissionSourceResponse from(EmissionSource entity) {
        return EmissionSourceResponse.builder()
                .id(entity.getId())
                .sourceCode(entity.getSourceCode())
                .sourceName(entity.getSourceName())
                .sourceType(entity.getSourceType())
                .scope(entity.getScope())
                .location(entity.getLocation())
                .status(entity.getStatus())
                .annualEmission(entity.getAnnualEmission())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
