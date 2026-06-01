package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpStress {
    private Long id;
    private String workerName;
    private String department;
    private Integer physicalEnv;
    private Integer jobDemand;
    private Integer autonomy;
    private Integer relationship;
    private Integer jobInsecurity;
    private Integer systemFairness;
    private Integer reward;
    private Integer workCulture;
    private Integer totalScore;
    private String riskLevel;
    private LocalDate assessmentDate;
    private Boolean hasCounseling;
    private String counselingNotes;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
