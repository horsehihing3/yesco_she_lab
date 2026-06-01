package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalObligationRequest {
    private String obligationType;
    private String category;
    @NotBlank
    private String obligationName;
    private String baseLaw;
    private String cycle;
    private String dept;
    private String ownerName;
    private LocalDate dueDate;
    private LocalDate nextDueDate;
    private String status;
    private Integer progress;
    private String evidence;
    private String penalty;
    private String icon;
}
