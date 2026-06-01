package com.smartehs.dto.response;

import com.smartehs.model.CarbonEmission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonEmissionResponse {
    private Long id;
    private LocalDate recordDate;
    private String sourceName;
    private Integer scope;
    private BigDecimal energyUsage;
    private String energyUnit;
    private BigDecimal co2Emission;
    private Long factorId;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static CarbonEmissionResponse from(CarbonEmission entity) {
        return CarbonEmissionResponse.builder()
                .id(entity.getId())
                .recordDate(entity.getRecordDate())
                .sourceName(entity.getSourceName())
                .scope(entity.getScope())
                .energyUsage(entity.getEnergyUsage())
                .energyUnit(entity.getEnergyUnit())
                .co2Emission(entity.getCo2Emission())
                .factorId(entity.getFactorId())
                .manager(entity.getManager())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
