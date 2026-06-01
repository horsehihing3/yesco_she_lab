package com.smartehs.dto.response;

import com.smartehs.model.HealthCheckup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupResponse {
    private Long id;
    private String checkupId;
    private String employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<HealthCheckupDetailResponse> details;

    public static HealthCheckupResponse from(HealthCheckup entity) {
        return HealthCheckupResponse.builder()
                .id(entity.getId())
                .checkupId(entity.getCheckupId())
                .employeeId(entity.getEmployeeId())
                .employeeName(entity.getEmployeeName())
                .employeeDept(entity.getEmployeeDept())
                .employeeEmail(entity.getEmployeeEmail())
                .checkupYear(entity.getCheckupYear())
                .checkupType(entity.getCheckupType())
                .isTarget(entity.getIsTarget())
                .checkupStatus(entity.getCheckupStatus())
                .checkupDate(entity.getCheckupDate())
                .hospital(entity.getHospital())
                .overallResult(entity.getOverallResult())
                .nextCheckupDate(entity.getNextCheckupDate())
                .notes(entity.getNotes())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static HealthCheckupResponse fromLocalized(HealthCheckup entity) {
        return from(entity);
    }
}
