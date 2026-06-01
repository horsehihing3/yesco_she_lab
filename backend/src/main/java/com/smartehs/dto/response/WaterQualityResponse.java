package com.smartehs.dto.response;

import com.smartehs.model.WaterQuality;
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
public class WaterQualityResponse {
    private Long id;
    private LocalDate measurementDate;
    private String measurementPoint;
    private BigDecimal ph;
    private BigDecimal bod;
    private BigDecimal cod;
    private BigDecimal ss;
    private BigDecimal tN;
    private BigDecimal tP;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WaterQualityResponse from(WaterQuality entity) {
        return WaterQualityResponse.builder()
                .id(entity.getId())
                .measurementDate(entity.getMeasurementDate())
                .measurementPoint(entity.getMeasurementPoint())
                .ph(entity.getPh())
                .bod(entity.getBod())
                .cod(entity.getCod())
                .ss(entity.getSs())
                .tN(entity.getTN())
                .tP(entity.getTP())
                .manager(entity.getManager())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
