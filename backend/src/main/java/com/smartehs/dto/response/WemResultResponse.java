package com.smartehs.dto.response;

import com.smartehs.model.WemResult;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemResultResponse {
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
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WemResultResponse from(WemResult entity) {
        return WemResultResponse.builder()
                .id(entity.getId())
                .processName(entity.getProcessName())
                .factorName(entity.getFactorName())
                .sampleType(entity.getSampleType())
                .measuredValue(entity.getMeasuredValue())
                .twaValue(entity.getTwaValue())
                .stelValue(entity.getStelValue())
                .exposureStandard(entity.getExposureStandard())
                .exceedRate(entity.getExceedRate())
                .judgment(entity.getJudgment())
                .hasReport(entity.getHasReport())
                .measurementDate(entity.getMeasurementDate())
                .measurementAgency(entity.getMeasurementAgency())
                .remarks(entity.getRemarks())
                .createdByUserId(entity.getCreatedByUserId())
                .createdByName(entity.getCreatedByName())
                .modifiedByUserId(entity.getModifiedByUserId())
                .modifiedByName(entity.getModifiedByName())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
