package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerSafetyExecution {
    private Long id;
    private Long planId;
    private String name;
    private String companyCode;
    private String phone;
    private String systemCode;
    private String systemUid;
    private LocalDateTime calledAt;
    private String executionToken;
    private String signature;
    private Long checklistTemplateId;
    private String checklistData;
    private Boolean completed;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
