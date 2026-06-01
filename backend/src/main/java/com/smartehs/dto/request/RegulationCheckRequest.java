package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegulationCheckRequest {
    @NotBlank private String checkName;
    private String relatedRegulation;
    private String checkType;
    private String assignee;
    private LocalDate dueDate;
    private Integer progress;
    private String status;
}
