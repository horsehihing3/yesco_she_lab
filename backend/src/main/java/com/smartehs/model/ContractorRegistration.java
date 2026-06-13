package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonIgnore private PersonRef createdBy;          // 작성자 — JSON 1컬럼(created_by NVARCHAR(MAX))
    // 수정자 — tb_contractor_registration.modified_by 는 레거시 username 문자열(nvarchar200) 컬럼 충돌이라 flat 유지(JSON 미전환)
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private static PersonRef ensure(PersonRef p) { return p != null ? p : new PersonRef(); }

    @JsonProperty("createdByUserId")   public Long   getCreatedByUserId()   { return PersonRef.userId(createdBy); }
    @JsonProperty("createdByName")     public String getCreatedByName()     { return PersonRef.name(createdBy); }
    @JsonProperty("createdByTeam")     public String getCreatedByTeam()     { return PersonRef.team(createdBy); }
    @JsonProperty("createdByPosition") public String getCreatedByPosition() { return PersonRef.position(createdBy); }
    public void setCreatedByUserId(Long v)     { (createdBy = ensure(createdBy)).setUserId(v); }
    public void setCreatedByName(String v)     { (createdBy = ensure(createdBy)).setName(v); }
    public void setCreatedByTeam(String v)     { (createdBy = ensure(createdBy)).setTeam(v); }
    public void setCreatedByPosition(String v) { (createdBy = ensure(createdBy)).setPosition(v); }
}
