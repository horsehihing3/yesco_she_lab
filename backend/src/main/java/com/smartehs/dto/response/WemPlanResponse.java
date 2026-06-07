package com.smartehs.dto.response;

import com.smartehs.model.WemPlan;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemPlanResponse {
    private Long id;
    private Integer planYear;
    private String processName;
    private String department;
    private String hazardType;
    private String measurementCycle;
    private LocalDate lastMeasurementDate;
    private LocalDate nextMeasurementDate;
    private String status;
    private String measurementAgency;
    private String agencyCode;
    private String contractPeriod;
    private String remarks;
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WemPlanResponse from(WemPlan entity) {
        return WemPlanResponse.builder()
                .id(entity.getId())
                .planYear(entity.getPlanYear())
                .processName(entity.getProcessName())
                .department(entity.getDepartment())
                .hazardType(entity.getHazardType())
                .measurementCycle(entity.getMeasurementCycle())
                .lastMeasurementDate(entity.getLastMeasurementDate())
                .nextMeasurementDate(entity.getNextMeasurementDate())
                .status(entity.getStatus())
                .measurementAgency(entity.getMeasurementAgency())
                .agencyCode(entity.getAgencyCode())
                .contractPeriod(entity.getContractPeriod())
                .remarks(entity.getRemarks())
                .createdByUserId(entity.getCreatedByUserId())
                .createdByName(entity.getCreatedByName())
                .modifiedByUserId(entity.getModifiedByUserId())
                .modifiedByName(entity.getModifiedByName())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
