package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthCheckupDetailRequest {
    private String bodyPart;
    private String category;
    private String resultValue;
    private String referenceRange;
    private String resultStatus;
    private String notes;
}
