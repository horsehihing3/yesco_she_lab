package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalImprovementRequest {
    private String improvementType;
    @NotBlank
    private String priority;
    @NotBlank
    private String title;
    private String baseLaw;
    private String description;
    private String dept;
    private String ownerName;
    private LocalDate targetDate;
    private String source;
    private String colStatus;
    private LocalDate registeredDate;
}
