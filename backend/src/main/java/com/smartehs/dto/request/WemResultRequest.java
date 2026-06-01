package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WemResultRequest {
    @NotBlank(message = "Process name is required")
    private String processName;
    @NotBlank(message = "Factor name is required")
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
}
