package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 법규 대응 계획 — tb_audit_plan 과 동일 구조의 별도 테이블 (tb_legal_compliance_plan) */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalCompliancePlan {
    private Long id;
    private String planId;
    private String auditName;
    private String auditType;
    private String targetDept;
    private String auditorName;
    private String auditorDept;
    private String personInCharge;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private String purpose;
    private String status;
    private String notes;
    private Long checklistTemplateId;
    private Boolean approved;
    private String approvedBy;
    private LocalDateTime approvedAt;
    // 사람 필드 — JSON 1컬럼(PersonRef), wire 는 flat 브릿지 접근자
    @JsonIgnore private PersonRef planApprover;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    @JsonIgnore private PersonRef completionApprover;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;
    @JsonIgnore private PersonRef createdBy;
    @JsonIgnore private PersonRef modifiedBy;
    private String rejectReason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    // ── flat 브릿지 접근자 ──
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
}
