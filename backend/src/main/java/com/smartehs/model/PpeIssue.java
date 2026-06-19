package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 보호구·장비 - 지급·반납 (tb_ppe_issue).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeIssue {
    private Long id;
    private LocalDate issueDate;
    private String workerName;
    private String empId;
    private String department;
    private Long itemId;
    private String itemName;
    private Integer quantity;
    private String issueReason;     // 신규지급/정기교체/파손교체/분실재지급
    private LocalDate returnDate;
    private String status;          // 지급완료/반납완료/교체요청/분실신고
    private Boolean signed;
    private String signatureImage;  // base64 (optional)
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
