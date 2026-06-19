package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 보호구·장비 - 검사·점검 (tb_ppe_inspection).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeInspection {
    private Long id;
    private LocalDate inspectionDate;
    private Long itemId;
    private String itemName;
    private String itemCode;
    private String inspectionType;  // 정기검사/자체점검/사전점검
    private String inspector;
    private String result;          // 합격/조건부합격/불합격/폐기
    private LocalDate nextDate;
    private String note;

    @JsonIgnore private PersonRef createdBy;
    @JsonIgnore private PersonRef modifiedBy;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private Boolean isDeleted;

    private static PersonRef ensure(PersonRef p) { return p != null ? p : new PersonRef(); }

    @JsonProperty("createdByUserId")   public Long   getCreatedByUserId()   { return PersonRef.userId(createdBy); }
    @JsonProperty("createdByName")     public String getCreatedByName()     { return PersonRef.name(createdBy); }
    @JsonProperty("createdByTeam")     public String getCreatedByTeam()     { return PersonRef.team(createdBy); }
    @JsonProperty("createdByPosition") public String getCreatedByPosition() { return PersonRef.position(createdBy); }
    public void setCreatedByUserId(Long v)    { (createdBy = ensure(createdBy)).setUserId(v); }
    public void setCreatedByName(String v)    { (createdBy = ensure(createdBy)).setName(v); }
    public void setCreatedByTeam(String v)    { (createdBy = ensure(createdBy)).setTeam(v); }
    public void setCreatedByPosition(String v){ (createdBy = ensure(createdBy)).setPosition(v); }

    @JsonProperty("modifiedByUserId")   public Long   getModifiedByUserId()   { return PersonRef.userId(modifiedBy); }
    @JsonProperty("modifiedByName")     public String getModifiedByName()     { return PersonRef.name(modifiedBy); }
    @JsonProperty("modifiedByTeam")     public String getModifiedByTeam()     { return PersonRef.team(modifiedBy); }
    @JsonProperty("modifiedByPosition") public String getModifiedByPosition() { return PersonRef.position(modifiedBy); }
    public void setModifiedByUserId(Long v)    { (modifiedBy = ensure(modifiedBy)).setUserId(v); }
    public void setModifiedByName(String v)    { (modifiedBy = ensure(modifiedBy)).setName(v); }
    public void setModifiedByTeam(String v)    { (modifiedBy = ensure(modifiedBy)).setTeam(v); }
    public void setModifiedByPosition(String v){ (modifiedBy = ensure(modifiedBy)).setPosition(v); }
}
