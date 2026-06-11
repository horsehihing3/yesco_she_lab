package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyHazardForm {
    private Long id;
    private String title;
    private String description;
    private String divisionName;
    private String departmentName;
    private String evaluator;
    private LocalDate surveyDate;
    private String teamMembers;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
