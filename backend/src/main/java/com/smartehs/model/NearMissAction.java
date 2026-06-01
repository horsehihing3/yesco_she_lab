package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearMissAction {
    private Long id;
    private String nearMissId;
    private String improvementMeasures;
    private String improvementMeasuresEn;
    private String improvementMeasuresZh;
    private String manageDept;
    private String responsiblePerson;
    private String responsiblePersonMail;
    private String responsiblePersonCompany;
    private LocalDateTime planDate;
    private LocalDateTime completeDate;
    private LocalDateTime createdAt;
}
