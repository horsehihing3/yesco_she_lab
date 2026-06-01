package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyDrill {
    private Long id;
    private String drillId;
    private Long planId;
    private String drillName;
    private String drillType;
    private String targetDept;
    private LocalDate scheduledDate;
    private Integer participantCount;
    private String evacuationTime;
    private String status;
    private String score;
    private String location;
    private String targetTime;
    private String scenario;
    private String notes;
    private Integer totalChecklist;
    private Integer completedChecklist;
    private Integer findingCount;
    private String modifiedBy;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
