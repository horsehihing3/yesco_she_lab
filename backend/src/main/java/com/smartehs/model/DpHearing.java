package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpHearing {
    private Long id;
    private String workerName;
    private String department;
    private Integer noiseLevel;
    private Integer exposureHours;
    private Integer right4k;
    private Integer right6k;
    private Integer left4k;
    private Integer left6k;
    private String stsResult;
    private String ppeType;
    private Integer ppeNrr;
    private LocalDate examDate;
    private String examType;
    private String status;
    private String notes;
    private Boolean deleted;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
