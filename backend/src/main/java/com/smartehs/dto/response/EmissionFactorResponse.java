package com.smartehs.dto.response;

import com.smartehs.model.EmissionFactor;
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
public class EmissionFactorResponse {
    private Long id;
    private String energySource;
    private String unit;
    private BigDecimal factorValue;
    private Integer baseYear;
    private String referenceOrg;
    private Integer scope;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EmissionFactorResponse from(EmissionFactor entity) {
        return EmissionFactorResponse.builder()
                .id(entity.getId())
                .energySource(entity.getEnergySource())
                .unit(entity.getUnit())
                .factorValue(entity.getFactorValue())
                .baseYear(entity.getBaseYear())
                .referenceOrg(entity.getReferenceOrg())
                .scope(entity.getScope())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
