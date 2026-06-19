package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeWearRequest {
    private LocalDateTime checkDatetime;
    private String workerName;
    private String department;
    private String workZone;
    private String requiredPpe;
    private String wearStatus;
    private String checker;
    private String actionTaken;
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
