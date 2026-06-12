package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 법규 대응 실시 — tb_audit 와 동일 구조의 별도 테이블 (tb_legal_compliance_exec) */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalComplianceExec {
    private Long id;
    private String auditId;
    private Long planId;
    private String auditName;
    private String auditType;
    private String targetDept;
    private String auditorName;
    private String auditorDept;
    private LocalDate auditStartDate;
    private LocalDate auditEndDate;
    private String grade;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    private String status;
    private String summary;
    private String notes;
    private String modifiedBy;   // 레거시 username 문자열 (flat 유지)
    // 사람 필드 — JSON 1컬럼(PersonRef)
    @JsonIgnore private PersonRef planApprover;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    @JsonIgnore private PersonRef completionApprover;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;
    @JsonIgnore private PersonRef createdBy;
    // 수정자 — legacy modified_by 충돌로 flat 유지
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private String rejectReason;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    // ── flat 브릿지 접근자 (createdBy / planApprover / completionApprover) ──
    private static PersonRef ensure(PersonRef p) { return p != null ? p : new PersonRef(); }

    @JsonProperty("createdByUserId")   public Long   getCreatedByUserId()   { return PersonRef.userId(createdBy); }
    @JsonProperty("createdByName")     public String getCreatedByName()     { return PersonRef.name(createdBy); }
    @JsonProperty("createdByTeam")     public String getCreatedByTeam()     { return PersonRef.team(createdBy); }
    @JsonProperty("createdByPosition") public String getCreatedByPosition() { return PersonRef.position(createdBy); }
    public void setCreatedByUserId(Long v)     { (createdBy = ensure(createdBy)).setUserId(v); }
    public void setCreatedByName(String v)     { (createdBy = ensure(createdBy)).setName(v); }
    public void setCreatedByTeam(String v)     { (createdBy = ensure(createdBy)).setTeam(v); }
    public void setCreatedByPosition(String v) { (createdBy = ensure(createdBy)).setPosition(v); }

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
