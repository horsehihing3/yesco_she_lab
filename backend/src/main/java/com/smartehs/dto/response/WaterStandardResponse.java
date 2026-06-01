package com.smartehs.dto.response;

import com.smartehs.model.WaterStandard;
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
public class WaterStandardResponse {
    private Long id;
    private String itemName;
    private String unit;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WaterStandardResponse from(WaterStandard entity) {
        return WaterStandardResponse.builder()
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
