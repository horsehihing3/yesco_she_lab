package com.smartehs.model;

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
    private String changeType;          // PROCESS / EQUIP / MATERIAL / PROCEDURE
    private String title;
    private String requesterName;
    private String requesterDept;
    private LocalDate requestDate;
    private LocalDate targetDate;
    private String reason;
    private String scope;
    private String riskMethod;          // HAZOP / WHATIF / CHECKLIST
    private String riskResult;          // APPROVED / CONDITIONAL / REJECTED
    private LocalDate riskReviewDate;
    private String riskOpinion;
    private String status;              // DRAFT / REVIEWING / APPROVING / EDUCATING / EXECUTING / PSSR / DONE / REJECTED
    private String planApproverName;
    private LocalDateTime planApprovedAt;
    private String completionApproverName;
    private LocalDateTime completionApprovedAt;
    private String rejectReason;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
