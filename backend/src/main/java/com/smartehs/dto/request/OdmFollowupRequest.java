package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdmFollowupRequest {
    @NotBlank(message = "Employee name is required")
    private String employeeName;
    private String judgment;
    private String actionType;
    private LocalDate actionStartDate;
    private LocalDate followupExamDate;
    private String status;
    private String remarks;
}
