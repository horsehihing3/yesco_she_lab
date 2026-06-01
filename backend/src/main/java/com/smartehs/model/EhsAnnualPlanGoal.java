package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EhsAnnualPlanGoal {
    private Long id;
    private Long planId;
    private String goalText;
    private String subGoal;
    private String task;
    private String kpi;
    private String prevResult;
    private String targetValue;
    private Long ownerUserId;
    private String ownerTeam;
    private String ownerName;
    private Boolean q1;
    private Boolean q2;
    private Boolean q3;
    private Boolean q4;
    private String q1Status;
    private String q2Status;
    private String q3Status;
    private String q4Status;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
