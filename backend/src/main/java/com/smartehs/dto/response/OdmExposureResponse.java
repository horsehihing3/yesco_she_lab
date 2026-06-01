package com.smartehs.dto.response;

import com.smartehs.model.OdmExposure;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmExposureResponse {
    private Long id;
    private String employeeName;
    private String employeeNo;
    private String department;
    private String hazardFactor;
    private String exposureLevel;
    private String exposureStandard;
    private String exposurePeriod;
    private String riskLevel;
    private Integer exceedCount;
    private Integer exposedWorkers;
    private LocalDate measurementDate;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdmExposureResponse from(OdmExposure entity) {
        return OdmExposureResponse.builder()
                .id(entity.getId())
                .employeeName(entity.getEmployeeName())
                .employeeNo(entity.getEmployeeNo())
                .department(entity.getDepartment())
                .hazardFactor(entity.getHazardFactor())
                .exposureLevel(entity.getExposureLevel())
                .exposureStandard(entity.getExposureStandard())
                .exposurePeriod(entity.getExposurePeriod())
                .riskLevel(entity.getRiskLevel())
                .exceedCount(entity.getExceedCount())
                .exposedWorkers(entity.getExposedWorkers())
                .measurementDate(entity.getMeasurementDate())
                .remarks(entity.getRemarks())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
