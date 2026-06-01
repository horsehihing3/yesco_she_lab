package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineRequest {

    @NotBlank(message = "Approval item code is required")
    private String approvalItemCode;

    private String deptCode;

    @NotNull(message = "Line order is required")
    private Integer lineOrder;

    @NotBlank(message = "Approver name is required")
    private String approverName;

    private String approverPosition;
    private String approverEmail;
    private String approverPhone;

    @NotBlank(message = "Approver department is required")
    private String approverDept;

    private Boolean hasFinalAuthority;
}
