package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrePlacementExamRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Long workPlaceId;
    private LocalDate examDate;

    @NotNull(message = "Exam year is required")
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
}
