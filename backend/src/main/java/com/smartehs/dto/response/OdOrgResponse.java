package com.smartehs.dto.response;

import com.smartehs.model.OdOrg;
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
public class OdOrgResponse {
    private Long id;
    private String name;
    private String doctor;
    private String orgType;
    private String factors;
    private Integer costPerPerson;
    private LocalDate contractEnd;
    private Integer targetCount;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdOrgResponse from(OdOrg e) {
        return OdOrgResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .doctor(e.getDoctor())
                .orgType(e.getOrgType())
                .factors(e.getFactors())
                .costPerPerson(e.getCostPerPerson())
                .contractEnd(e.getContractEnd())
                .targetCount(e.getTargetCount())
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
