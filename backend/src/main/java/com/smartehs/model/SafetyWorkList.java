package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyWorkList {
    private Long id;
    private String safetyWorkId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private String partners;
    private String partnersName;
    private String managerName;
    private String managerDept;
    private String approverName;
    private String approverMail;
    private String approverDept;
    private LocalDate approveDate;
    private String status;
    private String rejectComment;
    private String rejectBy;
    private LocalDate rejectDate;
    private String authorName;
    private String authorMail;
    private String authorDept;
    private String authorCompany;
    private LocalDate completedDate;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
