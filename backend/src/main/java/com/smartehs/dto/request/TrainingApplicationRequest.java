package com.smartehs.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingApplicationRequest {
    @NotNull(message = "Course id is required")
    private Long courseId;
    private String applicantName;
    private String applicantDept;
    private String applicantEmpNo;
    private String applicantPhone;
    private String reason;
    private String mealOption;
    private String transportOption;
}
