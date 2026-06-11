package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpThermal {
    private Long id;
    private String thermalType;
    private LocalDate occurDate;
    private String location;
    private String workerName;
    private String department;
    private String weatherCondition;
    private BigDecimal perceivedTemp;
    private String symptoms;
    private String severity;
    private String treatment;
    private String outcome;
    private String preventionAction;
    private String notes;
    private Boolean deleted;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
