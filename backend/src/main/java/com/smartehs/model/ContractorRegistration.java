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
    @JsonIgnore private PersonRef createdBy;
    @JsonIgnore private PersonRef modifiedBy;
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

    @JsonProperty("modifiedByUserId")   public Long   getModifiedByUserId()   { return PersonRef.userId(modifiedBy); }
    @JsonProperty("modifiedByName")     public String getModifiedByName()     { return PersonRef.name(modifiedBy); }
    @JsonProperty("modifiedByTeam")     public String getModifiedByTeam()     { return PersonRef.team(modifiedBy); }
    @JsonProperty("modifiedByPosition") public String getModifiedByPosition() { return PersonRef.position(modifiedBy); }
    public void setModifiedByUserId(Long v)     { (modifiedBy = ensure(modifiedBy)).setUserId(v); }
    public void setModifiedByName(String v)     { (modifiedBy = ensure(modifiedBy)).setName(v); }
    public void setModifiedByTeam(String v)     { (modifiedBy = ensure(modifiedBy)).setTeam(v); }
    public void setModifiedByPosition(String v) { (modifiedBy = ensure(modifiedBy)).setPosition(v); }
}
