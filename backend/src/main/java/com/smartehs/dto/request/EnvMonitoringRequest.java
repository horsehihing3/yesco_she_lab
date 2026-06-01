package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnvMonitoringRequest {

    @NotBlank(message = "Monitor type is required")
    private String monitorType;

    private String status;
    private String location;

    @NotNull(message = "Measurement date is required")
    private LocalDateTime measurementDate;

    @NotBlank(message = "Parameter name is required")
    private String parameterName;

    @NotNull(message = "Measured value is required")
    private BigDecimal measuredValue;

    @NotBlank(message = "Unit is required")
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
}
