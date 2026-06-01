package com.smartehs.dto.response;

import com.smartehs.model.Approval;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private Long id;
    private String approvalId;
    private String type;
    private String title;
    private String content;
    private String applicantName;
    private String applicantDept;
    private String applicantEmail;
    private String requestDate;
    private String status;
    private String approverName;
    private String approvalDate;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static ApprovalResponse from(Approval entity) {
        return ApprovalResponse.builder()
                .id(entity.getId())
                .approvalId(entity.getApprovalId())
                .type(entity.getType())
                .title(entity.getTitle())
                .content(entity.getContent())
                .applicantName(entity.getApplicantName())
                .applicantDept(entity.getApplicantDept())
                .applicantEmail(entity.getApplicantEmail())
                .requestDate(entity.getRequestDate())
                .status(entity.getStatus())
                .approverName(entity.getApproverName())
                .approvalDate(entity.getApprovalDate())
                .rejectReason(entity.getRejectReason())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
