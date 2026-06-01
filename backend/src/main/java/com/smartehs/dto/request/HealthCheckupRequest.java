package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthCheckupRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    private String employeeName;
    private String employeeDept;
    private String employeeEmail;

    @NotNull(message = "Checkup year is required")
    private Integer checkupYear;

    private String checkupType;
    private Boolean isTarget;
    private String checkupStatus;
    private LocalDate checkupDate;
    private String hospital;
    private String overallResult;
    private LocalDate nextCheckupDate;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;

    private List<HealthCheckupDetailRequest> details;
}
