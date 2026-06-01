package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DpInfect {
    private Long id;
    private String workerName;
    private String department;
    private String programType;
    private String diseaseType;
    private LocalDate implDate;
    private String result;
    private String status;
    private LocalDate nextDueDate;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
