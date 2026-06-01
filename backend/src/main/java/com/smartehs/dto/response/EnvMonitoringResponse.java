package com.smartehs.dto.response;

import com.smartehs.model.EnvMonitoring;
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
public class EnvMonitoringResponse {
    private Long id;
    private String monitorId;
    private String monitorType;
    private String status;
    private String location;
    private LocalDateTime measurementDate;
    private String parameterName;
    private BigDecimal measuredValue;
    private String unit;
    private BigDecimal standardValue;
    private String standardName;
    private Boolean exceedYn;
    private BigDecimal exceedRate;
    private String measurerName;
    private String measurerDept;
    private String equipmentName;
    private String equipmentModel;
    private String correctiveAction;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static EnvMonitoringResponse from(EnvMonitoring entity) {
        return EnvMonitoringResponse.builder()
                .id(entity.getId())
                .monitorId(entity.getMonitorId())
                .monitorType(entity.getMonitorType())
                .status(entity.getStatus())
                .location(entity.getLocation())
                .measurementDate(entity.getMeasurementDate())
                .parameterName(entity.getParameterName())
                .measuredValue(entity.getMeasuredValue())
                .unit(entity.getUnit())
                .standardValue(entity.getStandardValue())
                .standardName(entity.getStandardName())
                .exceedYn(entity.getExceedYn())
                .exceedRate(entity.getExceedRate())
                .measurerName(entity.getMeasurerName())
                .measurerDept(entity.getMeasurerDept())
                .equipmentName(entity.getEquipmentName())
                .equipmentModel(entity.getEquipmentModel())
                .correctiveAction(entity.getCorrectiveAction())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static EnvMonitoringResponse fromLocalized(EnvMonitoring entity) {
        return from(entity);
    }
}
