package com.smartehs.dto.response;

import com.smartehs.model.ContractorRegistration;
import com.smartehs.model.PersonRef;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ContractorRegistration raw 엔티티 반환 대체 DTO.
 * createdBy = PersonRef(JSON) → flat. modifiedBy = 레거시 flat 필드(직접). wire 100% 동일 유지.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorRegistrationResponse {
    private Long id;
    private String regNo;
    private String bizNum;
    private String corpNum;
    private String companyName;
    private String ceoName;
    private String bizType;
    private String bizCategory;
    private String zipCode;
    private String addr1;
    private String addr2;
    private String tel;
    private String fax;
    private String email;
    private String homepage;
    private String empSize;
    private String oshApply;
    private String safetyMgrStatus;
    private String healthMgrStatus;
    private BigDecimal accRate;
    private String certifications;
    private String riskEval;
    private LocalDate riskEvalDate;
    private String hazardFactors;
    private Short safetyRating;
    private Short envRating;
    private String regStatus;
    private String safetyMgrName;
    private String safetyMgrPosition;
    private String safetyMgrDept;
    private String safetyMgrTel;
    private String safetyMgrOfficeTel;
    private String safetyMgrEmail;
    private String healthMgrName;
    private String healthMgrPosition;
    private String healthMgrCert;
    private String healthMgrTel;
    private String healthMgrEmail;
    private String internalDept;
    private String internalName;
    private String internalTel;
    private String memo;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private String contractType;
    private BigDecimal contractAmount;
    private String workZone;
    private Boolean deleted;

    // createdBy: PersonRef → flat
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    // modifiedBy: 레거시 flat 필드(직접)
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static ContractorRegistrationResponse from(ContractorRegistration e) {
        return ContractorRegistrationResponse.builder()
                .id(e.getId())
                .regNo(e.getRegNo())
                .bizNum(e.getBizNum())
                .corpNum(e.getCorpNum())
                .companyName(e.getCompanyName())
                .ceoName(e.getCeoName())
                .bizType(e.getBizType())
                .bizCategory(e.getBizCategory())
                .zipCode(e.getZipCode())
                .addr1(e.getAddr1())
                .addr2(e.getAddr2())
                .tel(e.getTel())
                .fax(e.getFax())
                .email(e.getEmail())
                .homepage(e.getHomepage())
                .empSize(e.getEmpSize())
                .oshApply(e.getOshApply())
                .safetyMgrStatus(e.getSafetyMgrStatus())
                .healthMgrStatus(e.getHealthMgrStatus())
                .accRate(e.getAccRate())
                .certifications(e.getCertifications())
                .riskEval(e.getRiskEval())
                .riskEvalDate(e.getRiskEvalDate())
                .hazardFactors(e.getHazardFactors())
                .safetyRating(e.getSafetyRating())
                .envRating(e.getEnvRating())
                .regStatus(e.getRegStatus())
                .safetyMgrName(e.getSafetyMgrName())
                .safetyMgrPosition(e.getSafetyMgrPosition())
                .safetyMgrDept(e.getSafetyMgrDept())
                .safetyMgrTel(e.getSafetyMgrTel())
                .safetyMgrOfficeTel(e.getSafetyMgrOfficeTel())
                .safetyMgrEmail(e.getSafetyMgrEmail())
                .healthMgrName(e.getHealthMgrName())
                .healthMgrPosition(e.getHealthMgrPosition())
                .healthMgrCert(e.getHealthMgrCert())
                .healthMgrTel(e.getHealthMgrTel())
                .healthMgrEmail(e.getHealthMgrEmail())
                .internalDept(e.getInternalDept())
                .internalName(e.getInternalName())
                .internalTel(e.getInternalTel())
                .memo(e.getMemo())
                .contractStart(e.getContractStart())
                .contractEnd(e.getContractEnd())
                .contractType(e.getContractType())
                .contractAmount(e.getContractAmount())
                .workZone(e.getWorkZone())
                .deleted(e.getDeleted())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(e.getModifiedByUserId())
                .modifiedByName(e.getModifiedByName())
                .modifiedByTeam(e.getModifiedByTeam())
                .modifiedByPosition(e.getModifiedByPosition())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
