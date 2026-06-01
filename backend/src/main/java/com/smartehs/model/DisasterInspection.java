package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DisasterInspection {
    private Long id;
    private LocalDate inspDate;
    private String facilityName;
    private String facType;
    private String location;
    private String checker;
    private String content;
    private String anomaly;
    private String actionTaken;
    private String doneStatus;
    private LocalDate nextCheck;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
