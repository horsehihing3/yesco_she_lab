package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermitWorker {
    private Long id;
    private Long permitId;
    private String workerName;
    private String workerCompany;
    private String workerPhone;
    private String workerType;
    private String notes;
    private LocalDateTime createdAt;
}
