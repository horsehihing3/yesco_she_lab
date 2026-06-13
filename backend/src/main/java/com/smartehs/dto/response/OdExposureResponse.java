package com.smartehs.dto.response;

import com.smartehs.model.OdExposure;
import com.smartehs.model.PersonRef;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdExposureResponse {
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

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdExposureResponse from(OdExposure e) {
        return OdExposureResponse.builder()
                .id(e.getId())
                .factorName(e.getFactorName())
                .factorClass(e.getFactorClass())
                .dept(e.getDept())
                .processName(e.getProcessName())
                .measuredValue(e.getMeasuredValue())
                .twaStandard(e.getTwaStandard())
                .exposureRatio(e.getExposureRatio())
                .measureDate(e.getMeasureDate())
                .workerCount(e.getWorkerCount())
                .status(e.getStatus())
                .action(e.getAction())
                .deleted(e.getDeleted())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
