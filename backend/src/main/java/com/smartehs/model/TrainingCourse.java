package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingCourse {
    private Long id;
    private String courseCode;
    private String courseName;
    private String category;            // LEGAL_GENERAL / LEGAL_SPECIAL / NEW_HIRE / MANAGER / OTHER
    private String catType;             // safety/health/environment/special/manager (배너 색상)
    private String targetAudience;
    private BigDecimal durationHours;
    private String cycle;               // QUARTERLY / SEMI_ANNUAL / ANNUAL / AS_NEEDED
    private Boolean legalRequired;
    private String instructor;
    private String description;
    private LocalDate dateStart;
    private LocalDate dateEnd;
    private String location;
    private String mode;                // CLASSROOM / ONLINE / HYBRID
    private String status;              // OPEN / CLOSED / PREPARING / ENDED
    private Integer totalSeats;
    private Integer currentSeats;
    private String lawBasis;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
