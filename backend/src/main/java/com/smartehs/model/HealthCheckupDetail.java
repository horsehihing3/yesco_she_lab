package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupDetail {
    private Long id;
    private String checkupId;
    private String bodyPart;
    private String category;
    private String resultValue;
    private String referenceRange;
    private String resultStatus;
    private String notes;
    private LocalDateTime createdAt;
}
