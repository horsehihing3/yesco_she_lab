package com.smartehs.dto.response;

import com.smartehs.model.ApprovalLine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalLineResponse {

    private Long id;
    private String approvalItemCode;
    private String deptCode;
    private Integer lineOrder;
    private String approverName;
    private String approverPosition;
    private String approverEmail;
    private String approverPhone;
    private String approverDept;
    private Boolean hasFinalAuthority;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static ApprovalLineResponse from(ApprovalLine entity) {
        return ApprovalLineResponse.builder()
                .id(entity.getId())
                .approvalItemCode(entity.getApprovalItemCode())
                .deptCode(entity.getDeptCode())
                .lineOrder(entity.getLineOrder())
                .approverName(entity.getApproverName())
                .approverPosition(entity.getApproverPosition())
                .approverEmail(entity.getApproverEmail())
                .approverPhone(entity.getApproverPhone())
                .approverDept(entity.getApproverDept())
                .hasFinalAuthority(entity.getHasFinalAuthority())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
