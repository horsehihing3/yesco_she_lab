package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvMonitoring {
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
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
