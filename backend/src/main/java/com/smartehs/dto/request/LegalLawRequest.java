package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalLawRequest {
    @NotBlank
    private String category;
    @NotBlank
    private String lawName;
    private String clause;
    private String amendType;
    private LocalDate promulgateDate;
    private LocalDate enforceDate;
    private String reviewer;
    private LocalDate reviewDueDate;
    private String reviewStatus;
    private String applyYn;
    private String followUpAction;
    private String amendSummary;
    private Boolean urgent;
}
