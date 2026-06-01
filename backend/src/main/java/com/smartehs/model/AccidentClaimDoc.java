package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccidentClaimDoc {
    private Long id;
    private Long claimId;
    private String docType;
    private String docName;
    private Boolean isRequired;
    private Boolean isSubmitted;
    private Long fileId;
    private String notes;
    private LocalDateTime createdAt;
}
