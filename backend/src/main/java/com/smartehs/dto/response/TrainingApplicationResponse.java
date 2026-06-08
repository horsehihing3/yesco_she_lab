package com.smartehs.dto.response;

import com.smartehs.model.TrainingApplication;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingApplicationResponse {
    private Long id;
    private String applicationNo;
    private Long courseId;
    private String courseName;
    private String courseDate;
    private String applicantName;
    private String applicantDept;
    private String applicantPosition;
    private String applicantEmpNo;
    private String applicantPhone;
    private String applicantUsername;
    private LocalDate applyDate;
    private String status;
    private String reason;
    private String mealOption;
    private String transportOption;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectReason;
    private LocalDate completionDate;
    private String completionScore;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static TrainingApplicationResponse from(TrainingApplication e) {
        return TrainingApplicationResponse.builder()
                .id(e.getId())
                .applicationNo(e.getApplicationNo())
                .courseId(e.getCourseId())
                .courseName(e.getCourseName())
                .courseDate(e.getCourseDate())
                .applicantName(e.getApplicantName())
                .applicantDept(e.getApplicantDept())
                .applicantPosition(e.getApplicantPosition())
                .applicantEmpNo(e.getApplicantEmpNo())
                .applicantPhone(e.getApplicantPhone())
                .applicantUsername(e.getApplicantUsername())
                .applyDate(e.getApplyDate())
                .status(e.getStatus())
                .reason(e.getReason())
                .mealOption(e.getMealOption())
                .transportOption(e.getTransportOption())
                .approvedBy(e.getApprovedBy())
                .approvedAt(e.getApprovedAt())
                .rejectReason(e.getRejectReason())
                .completionDate(e.getCompletionDate())
                .completionScore(e.getCompletionScore())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
