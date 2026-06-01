package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdmSuspectRequest {
    @NotBlank(message = "Employee name is required")
    private String employeeName;
    private String employeeNo;
    private String department;
    private String symptoms;
    private String hazardFactor;
    private LocalDate reportDate;
    private String status;
    private String doctor;
    private String remarks;
}
