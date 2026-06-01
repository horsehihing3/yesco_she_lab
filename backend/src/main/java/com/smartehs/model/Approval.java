package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval {
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
}
