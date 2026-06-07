package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsmPtw {
    private Long id;
    private String ptwNo;
    private String permitType;          // HOT_WORK/CONFINED_SPACE/HEIGHT/ELECTRICAL/GENERAL
    private String workName;
    private String workLocation;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String supervisorName;
    private String supervisorDept;
    private String workDescription;
    private String safetyChecksJson;
    private String supervisorSign;
    private LocalDateTime supervisorSignedAt;
    private String ehsApproverName;
    private LocalDateTime ehsApprovedAt;
    private String opsApproverName;
    private LocalDateTime opsApprovedAt;
    private String status;              // DRAFT/SUBMITTED/APPROVED/COMPLETED/REJECTED/EXPIRED
    private String rejectReason;
    private String relatedMocNo;
    private String relatedWoNo;
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
