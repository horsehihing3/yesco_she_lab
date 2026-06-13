package com.smartehs.dto.response;

import com.smartehs.model.RadMeasurement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** RadMeasurement raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadMeasurementResponse {
    private Long id;
    private LocalDate measureDate;
    private String zoneName;
    private String pointName;
    private String measureType;
    private BigDecimal measureValue;
    private String unit;
    private String standardValue;
    private String device;
    private String measurer;
    private String evaluation;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static RadMeasurementResponse from(RadMeasurement e) {
        return RadMeasurementResponse.builder()
                .id(e.getId())
                .measureDate(e.getMeasureDate())
                .zoneName(e.getZoneName())
                .pointName(e.getPointName())
                .measureType(e.getMeasureType())
                .measureValue(e.getMeasureValue())
                .unit(e.getUnit())
                .standardValue(e.getStandardValue())
                .device(e.getDevice())
                .measurer(e.getMeasurer())
                .evaluation(e.getEvaluation())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
