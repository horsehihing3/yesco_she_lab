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
public class PsmMoc {
    private Long id;
    private String mocNo;
    private String changeType;
    private String title;
    private String requesterName;
    private String requesterDept;
    private LocalDate requestDate;
    private LocalDate targetDate;
    private String reason;
    private String scope;
    private String riskMethod;
    private String riskResult;
    private LocalDate riskReviewDate;
    private String riskOpinion;
    private String status;
    @JsonIgnore private PersonRef planApprover;
    private LocalDateTime planApprovedAt;
    @JsonIgnore private PersonRef completionApprover;
    private LocalDateTime completionApprovedAt;
    private String rejectReason;
    @JsonIgnore private PersonRef createdBy;
    @JsonIgnore private PersonRef modifiedBy;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private static PersonRef ensure(PersonRef p) { return p != null ? p : new PersonRef(); }

    @JsonProperty("planApproverUserId")   public Long   getPlanApproverUserId()   { return PersonRef.userId(planApprover); }
    @JsonProperty("planApproverName")     public String getPlanApproverName()     { return PersonRef.name(planApprover); }
    @JsonProperty("planApproverTeam")     public String getPlanApproverTeam()     { return PersonRef.team(planApprover); }
    @JsonProperty("planApproverPosition") public String getPlanApproverPosition() { return PersonRef.position(planApprover); }
    public void setPlanApproverUserId(Long v)     { (planApprover = ensure(planApprover)).setUserId(v); }
    public void setPlanApproverName(String v)     { (planApprover = ensure(planApprover)).setName(v); }
    public void setPlanApproverTeam(String v)     { (planApprover = ensure(planApprover)).setTeam(v); }
    public void setPlanApproverPosition(String v) { (planApprover = ensure(planApprover)).setPosition(v); }

    @JsonProperty("completionApproverUserId")   public Long   getCompletionApproverUserId()   { return PersonRef.userId(completionApprover); }
    @JsonProperty("completionApproverName")     public String getCompletionApproverName()     { return PersonRef.name(completionApprover); }
    @JsonProperty("completionApproverTeam")     public String getCompletionApproverTeam()     { return PersonRef.team(completionApprover); }
    @JsonProperty("completionApproverPosition") public String getCompletionApproverPosition() { return PersonRef.position(completionApprover); }
    public void setCompletionApproverUserId(Long v)     { (completionApprover = ensure(completionApprover)).setUserId(v); }
    public void setCompletionApproverName(String v)     { (completionApprover = ensure(completionApprover)).setName(v); }
    public void setCompletionApproverTeam(String v)     { (completionApprover = ensure(completionApprover)).setTeam(v); }
    public void setCompletionApproverPosition(String v) { (completionApprover = ensure(completionApprover)).setPosition(v); }

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
