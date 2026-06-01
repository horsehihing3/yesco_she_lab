package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadMeasurement {
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
}
