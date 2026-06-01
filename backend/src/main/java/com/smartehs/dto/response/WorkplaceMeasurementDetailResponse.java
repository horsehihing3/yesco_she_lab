package com.smartehs.dto.response;

import com.smartehs.model.WorkplaceMeasurementDetail;
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
public class WorkplaceMeasurementDetailResponse {
    private Long id;
    private String measurementId;
    private String hazardousFactor;
    private String hazardousFactorEn;
    private String hazardousFactorZh;
    private String factorType;
    private String workProcess;
    private String measurementValue;
    private String exposureStandard;
    private String unit;
    private BigDecimal resultRatio;
    private String resultStatus;
    private Integer employeeCount;
    private String notes;
    private LocalDateTime createdAt;

    public static WorkplaceMeasurementDetailResponse from(WorkplaceMeasurementDetail entity) {
        return WorkplaceMeasurementDetailResponse.builder()
                .id(entity.getId())
                .measurementId(entity.getMeasurementId())
                .hazardousFactor(entity.getHazardousFactor())
                .hazardousFactorEn(entity.getHazardousFactorEn())
                .hazardousFactorZh(entity.getHazardousFactorZh())
                .factorType(entity.getFactorType())
                .workProcess(entity.getWorkProcess())
                .measurementValue(entity.getMeasurementValue())
                .exposureStandard(entity.getExposureStandard())
                .unit(entity.getUnit())
                .resultRatio(entity.getResultRatio())
                .resultStatus(entity.getResultStatus())
                .employeeCount(entity.getEmployeeCount())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
