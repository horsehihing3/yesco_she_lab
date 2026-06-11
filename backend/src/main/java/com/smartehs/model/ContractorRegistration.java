package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorRegistration {
    private Long id;
    private String regNo;            // EHS-2026-1234

    // Step1 사업자 기본
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

    // Step2 안전보건
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
    private String regStatus;       // APPROVED / REVIEW / HOLD

    // Step3 담당자
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

    // Step4 계약
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private String contractType;
    private BigDecimal contractAmount;
    private String workZone;

    private Boolean deleted;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private String modifiedBy;
}
