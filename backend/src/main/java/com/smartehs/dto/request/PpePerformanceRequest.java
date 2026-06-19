package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpePerformanceRequest {
    private LocalDate evaluationDate;
    private Long itemId;
    private String itemName;
    private String performanceStandard;
    private String standardValue;
    private String measuredValue;
    private String result;
    private String evaluator;
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
}
