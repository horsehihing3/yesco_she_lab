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
public class PsmIncident {
    private Long id;
    private String incidentNo;
    private String incidentType;
    private LocalDateTime occurAt;
    private String location;
    private String relatedEquipment;
    private String relatedMaterial;
    private String firstFinder;
    private String reporter;
    private String investigator;
    private LocalDateTime reportedAt;
    private String narrative;
    private String severity;
    private String humanFactorsJson;
    private String technicalFactorsJson;
    private String why1;
    private String why2;
    private String why3;
    private String why4;
    private String why5;
    private String managementCause;
    private Integer deaths;
    private Integer seriousInjuries;
    private Integer minorInjuries;
    private String injuryType;
    private String damagedEquipment;
    private BigDecimal propertyLoss;
    private BigDecimal productionLoss;
    private BigDecimal downtimeHours;
    private String envImpact;
    private LocalDate recoveryDate;
    private String actionsJson;
    private String technicalAction;
    private String managerialAction;
    private String similarCheckPlan;
    private String psmImprovement;
    private String status;
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
