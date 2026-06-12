package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdOrg {
    private Long id;
    private String name;
    private String doctor;
    private String orgType;
    private String factors;
    private Integer costPerPerson;
    private LocalDate contractEnd;
    private Integer targetCount;
    private Boolean deleted;
    @JsonIgnore private PersonRef createdBy;
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
