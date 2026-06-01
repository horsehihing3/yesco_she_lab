package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Title is required")
    private String title;

    private String content;

    @NotBlank(message = "Applicant name is required")
    private String applicantName;

    @NotBlank(message = "Applicant department is required")
    private String applicantDept;

    private String applicantEmail;

    @NotBlank(message = "Request date is required")
    private String requestDate;

    private String status;
    private String approverName;
    private String approvalDate;
    private String rejectReason;
}
