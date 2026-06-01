package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorWorker {
    private Long id;
    private Long planId;
    private String workerName;
    private String workerPhone;
    private String companyName;
    private String notes;
    private LocalDateTime createdAt;
}
