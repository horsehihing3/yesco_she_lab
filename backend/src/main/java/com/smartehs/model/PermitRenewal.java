package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitRenewal {
    private Long id;
    private String permitName;
    private String category;
    private String stage;
    private LocalDate currentExpiry;
    private LocalDate targetDate;
    private LocalDate startDate;
    private String assignee;
    private String nextAction;
    private LocalDate dueDate;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
