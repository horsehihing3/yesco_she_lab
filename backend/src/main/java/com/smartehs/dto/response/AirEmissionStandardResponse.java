package com.smartehs.dto.response;

import com.smartehs.model.AirEmissionStandard;
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
public class AirEmissionStandardResponse {
    private Long id;
    private String itemName;
    private String unit;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static AirEmissionStandardResponse from(AirEmissionStandard entity) {
        return AirEmissionStandardResponse.builder()
                .id(entity.getId())
                .itemName(entity.getItemName())
                .unit(entity.getUnit())
                .minValue(entity.getMinValue())
                .maxValue(entity.getMaxValue())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
