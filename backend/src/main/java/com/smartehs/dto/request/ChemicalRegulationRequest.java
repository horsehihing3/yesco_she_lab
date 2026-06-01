package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalRegulationRequest {
    @NotBlank private String regName;
    private String regType;
    private String authority;
    private Integer applicableCount;
    private LocalDate lastRevisionDate;
    private LocalDate nextReviewDate;
    private String status;
}
