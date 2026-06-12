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
public class PsmData {
    private Long id;
    private String category;
    private String code;
    private String nameKo;
    private String typeLabel;
    private String location;
    private String manufacturer;
    private LocalDate installDate;
    private String designPressure;
    private String designTemperature;
    private String material;
    private String inspectionCycle;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private String statusCode;
    private String managerName;
    private String notes;
    private String extraA;
    private String extraB;
    private String extraC;
    private String casNumber;
    private String ghsClass;
    private BigDecimal regulatedQtyKg;
    private BigDecimal holdingQtyKg;
    private Boolean psmTarget;
    private String setPressure;
    private String protectedEquip;
    @JsonIgnore private PersonRef createdBy;
    @JsonIgnore private PersonRef modifiedBy;
    private Boolean deleted;
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
