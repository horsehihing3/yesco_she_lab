package com.smartehs.dto.response;

import com.smartehs.model.OdPlan;
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
public class OdPlanResponse {
    private Long id;
    private String half;
    private String orgName;
    private String method;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer targetCount;
    private String hazardFactors;
    private String mgr;
    private String status;
    private String note;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdPlanResponse from(OdPlan e) {
        return OdPlanResponse.builder()
                .id(e.getId())
                .half(e.getHalf())
                .orgName(e.getOrgName())
                .method(e.getMethod())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .targetCount(e.getTargetCount())
                .hazardFactors(e.getHazardFactors())
                .mgr(e.getMgr())
                .status(e.getStatus())
                .note(e.getNote())
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
