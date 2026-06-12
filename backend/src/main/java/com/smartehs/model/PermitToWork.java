package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermitToWork {
    private Long id;
    private String permitId;
    private String permitType;
    private String riskLevel;
    private String status;
    private String title;
    private String description;
    private String workLocation;
    private LocalDateTime workStartDate;
    private LocalDateTime workEndDate;
    private String requesterName;
    private String requesterDept;
    private String requesterId;
    private String approverName;
    private String approverDept;
    private String approverId;
    private LocalDateTime approvedAt;
    private String safetyMeasures;
    private String requiredPpe;
    private String hazardFactors;
    private String emergencyContact;
    private Integer workersCount;
    private String rejectionReason;
    private LocalDateTime completedAt;
    private String notes;
    private Long checklistTemplateId;
    private String inspectorName;
    private Boolean isExternal;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    // 작성자 — JSON(PersonRef)
    @JsonIgnore private PersonRef createdBy;
    private String modifiedBy;   // 레거시 username 문자열 (flat 유지)
    private Boolean deleted;
    // 계획 / 완료 결재 — JSON(PersonRef)
    @JsonIgnore private PersonRef planApprover;
    private LocalDateTime planApprovedAt;
    private String planApprovedBy;
    @JsonIgnore private PersonRef completionApprover;
    private LocalDateTime completionApprovedAt;
    private String completionApprovedBy;
    private String rejectReason;
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
