package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdExposure {
    private Long id;
    private String factorName;
    private String factorClass;
    private String dept;
    private String processName;
    private String measuredValue;
    private String twaStandard;
    private Integer exposureRatio;
    private LocalDate measureDate;
    private Integer workerCount;
    private String status;
    private String action;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
