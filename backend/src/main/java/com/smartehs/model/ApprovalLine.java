package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalLine {
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
}
