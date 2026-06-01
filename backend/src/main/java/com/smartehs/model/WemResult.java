package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemResult {
    private Long id;
    private String processName;
    private String factorName;
    private String sampleType;
    private String measuredValue;
    private String twaValue;
    private String stelValue;
    private String exposureStandard;
    private Integer exceedRate;
    private String judgment;
    private Boolean hasReport;
    private LocalDate measurementDate;
    private String measurementAgency;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
