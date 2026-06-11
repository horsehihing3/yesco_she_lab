package com.smartehs.dto.response;

import com.smartehs.model.WemImprovement;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemImprovementResponse {
    private Long id;
    private String processName;
    private String factorName;
    private String measuredValue;
    private String exposureStandard;
    private Integer exceedRate;
    private String exceedLevel;
    private String department;
    private LocalDate measurementDate;
    private String measurementAgency;
    private LocalDate deadline;
    private Integer remainingDays;
    private String improvementPlan;
    private String status;
    private LocalDate completionDate;
    private String remarks;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WemImprovementResponse from(WemImprovement entity) {
        return WemImprovementResponse.builder()
                .id(entity.getId())
                .processName(entity.getProcessName())
                .factorName(entity.getFactorName())
                .measuredValue(entity.getMeasuredValue())
                .exposureStandard(entity.getExposureStandard())
                .exceedRate(entity.getExceedRate())
                .exceedLevel(entity.getExceedLevel())
                .department(entity.getDepartment())
                .measurementDate(entity.getMeasurementDate())
                .measurementAgency(entity.getMeasurementAgency())
                .deadline(entity.getDeadline())
                .remainingDays(entity.getRemainingDays())
                .improvementPlan(entity.getImprovementPlan())
                .status(entity.getStatus())
                .completionDate(entity.getCompletionDate())
                .remarks(entity.getRemarks())
                .createdByUserId(entity.getCreatedByUserId())
                .createdByName(entity.getCreatedByName())
                .createdByTeam(entity.getCreatedByTeam())
                .createdByPosition(entity.getCreatedByPosition())
                .modifiedByUserId(entity.getModifiedByUserId())
                .modifiedByName(entity.getModifiedByName())
                .modifiedByTeam(entity.getModifiedByTeam())
                .modifiedByPosition(entity.getModifiedByPosition())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
