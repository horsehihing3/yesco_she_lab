package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitChange {
    private Long id;
    private String changeType;
    private String title;
    private String description;
    private LocalDate requestDate;
    private LocalDate plannedDate;
    private String initiator;
    private String approver;
    private String impactAssessment;
    private String status;
    private String affectedPermits;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
