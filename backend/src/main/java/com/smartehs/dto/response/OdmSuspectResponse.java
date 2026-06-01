package com.smartehs.dto.response;

import com.smartehs.model.OdmSuspect;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmSuspectResponse {
    private Long id;
    private String employeeName;
    private String employeeNo;
    private String department;
    private String symptoms;
    private String hazardFactor;
    private LocalDate reportDate;
    private String status;
    private String doctor;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdmSuspectResponse from(OdmSuspect entity) {
        return OdmSuspectResponse.builder()
                .id(entity.getId())
                .employeeName(entity.getEmployeeName())
                .employeeNo(entity.getEmployeeNo())
                .department(entity.getDepartment())
                .symptoms(entity.getSymptoms())
                .hazardFactor(entity.getHazardFactor())
                .reportDate(entity.getReportDate())
                .status(entity.getStatus())
                .doctor(entity.getDoctor())
                .remarks(entity.getRemarks())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
