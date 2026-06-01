package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccidentReport {
    private Long id;
    private String caseDescription;
    private String disasterType;
    private Boolean isNearMiss;
    private Boolean isFatal;
    private Boolean leaveOverMonth;
    private Boolean leaveUnderMonth;
    private Boolean freqNone;
    private String occurrenceCycle;
    private String relatedProcess;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
