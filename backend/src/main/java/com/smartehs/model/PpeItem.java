package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 보호구·장비 - 품목 마스터 (tb_ppe_item).
 * 사람 필드는 JSON 1컬럼 PersonRef 로 저장(typeHandler), wire 는 flat 유지(브릿지 접근자).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeItem {
    private Long id;
    private String itemCode;       // PPE-001 자동 생성
    private String name;
    private String category;       // 두부보호/호흡기/발/눈/손/추락/청력/전신
    private String modelNo;
    private String kcCertNo;
    private String grade;
    private String supplier;
    private Integer unitPrice;     // 원
    private Integer replaceCycle;  // 개월
    private LocalDate certExpiry;
    private Integer minStock;
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
