package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {
    private Long id;
    private String riskId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String site;
    private Long authorUserId;
    private String authorName;
    private String authorDept;
    private String authorTeam;
    private String authorPosition;
    private String authorMail;
    // 호환용: 기존 단일 결재자
    private String approverName;
    private String approverMail;

    // 계획 승인자 — JSON(PersonRef)
    @JsonIgnore private PersonRef planApprover;
    private java.time.LocalDateTime planApprovedAt;
    private String planApprovedBy;

    // 완료 승인자 — JSON(PersonRef)
    @JsonIgnore private PersonRef completionApprover;
    private java.time.LocalDateTime completionApprovedAt;
    private String completionApprovedBy;

    // status: draft / submitted / approved / completion_submitted / completed / rejected
    private String status;
    private Integer riskRegisterCount;
    private Integer officeCount;
    private Integer fieldCount;
    private LocalDateTime completedDate;
    private String rejectReason;
    private Boolean allowResubmit;
    private Long formId;
    private String formTitle;
    private Integer detailCount;
    // 사무업무 탭 Step 2/3/4 에 연결되는 체크리스트 템플릿 ID (tb_checklist_template.id)
    private Long officeChecklistId;
    private Long sanupChecklistId;
    private Long jungdaeChecklistId;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    // ── flat 브릿지 접근자 (planApprover / completionApprover) ──
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
}
