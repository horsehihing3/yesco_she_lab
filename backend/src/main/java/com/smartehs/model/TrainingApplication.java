package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingApplication {
    private Long id;
    private String applicationNo;
    private Long courseId;
    private String courseName;          // snapshot
    private String courseDate;          // snapshot
    private String applicantName;
    private String applicantDept;
    private String applicantPosition;
    private String applicantEmpNo;
    private String applicantPhone;
    private String applicantUsername;
    private LocalDate applyDate;
    private String status;              // PENDING / APPROVED / COMPLETED / REJECTED / CANCELLED
    private String reason;
    private String mealOption;
    private String transportOption;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectReason;
    private LocalDate completionDate;
    private String completionScore;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
