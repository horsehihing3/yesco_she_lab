package com.smartehs.dto.response;

import com.smartehs.model.AirEmission;
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
public class AirEmissionResponse {
    private Long id;
    private LocalDate measurementDate;
    private String facility;
    private String pollutant;
    private BigDecimal emissionConcentration;
    private String unit;
    private BigDecimal emissionStandard;
    private String compliance;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static AirEmissionResponse from(AirEmission entity) {
        return AirEmissionResponse.builder()
                .id(entity.getId())
                .measurementDate(entity.getMeasurementDate())
                .facility(entity.getFacility())
                .pollutant(entity.getPollutant())
                .emissionConcentration(entity.getEmissionConcentration())
                .unit(entity.getUnit())
                .emissionStandard(entity.getEmissionStandard())
                .compliance(entity.getCompliance())
                .manager(entity.getManager())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
