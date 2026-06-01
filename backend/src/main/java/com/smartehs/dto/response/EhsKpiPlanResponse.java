package com.smartehs.dto.response;

import com.smartehs.model.EhsKpiPlan;
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
public class EhsKpiPlanResponse {
    private Long id;
    private Integer planYear;
    private String indicatorType;
    private String indicatorName;
    private String description;
    private String department;
    private String responsiblePerson;
    private String measurementPeriod;
    private String unit;
    private BigDecimal targetValue;
    private BigDecimal currentValue;
    private BigDecimal achievementRate;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EhsKpiPlanResponse from(EhsKpiPlan entity) {
        return EhsKpiPlanResponse.builder()
                .id(entity.getId())
                .planYear(entity.getPlanYear())
                .indicatorType(entity.getIndicatorType())
                .indicatorName(entity.getIndicatorName())
                .description(entity.getDescription())
                .department(entity.getDepartment())
                .responsiblePerson(entity.getResponsiblePerson())
                .measurementPeriod(entity.getMeasurementPeriod())
                .unit(entity.getUnit())
                .targetValue(entity.getTargetValue())
                .currentValue(entity.getCurrentValue())
                .achievementRate(entity.getAchievementRate())
                .status(entity.getStatus())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
