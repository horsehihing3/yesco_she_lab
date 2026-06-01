package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrePlacementExam {
    private Long id;
    private String examId;
    private String employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Long workPlaceId;
    private LocalDate examDate;
    private Integer examYear;
    private String targetJob;
    private String hazardousFactors;
    private String hospital;
    private String examResult;
    private String resultDetail;
    private String restrictionDetail;
    private Boolean followUpRequired;
    private LocalDate followUpDate;
    private String status;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
