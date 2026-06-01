package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCourseRequest {
    @NotBlank(message = "Course code is required")
    private String courseCode;

    @NotBlank(message = "Course name is required")
    private String courseName;

    private String category;
    private String catType;
    private String targetAudience;
    private BigDecimal durationHours;
    private String cycle;
    private Boolean legalRequired;
    private String instructor;
    private String description;
    private LocalDate dateStart;
    private LocalDate dateEnd;
    private String location;
    private String mode;
    private String status;
    private Integer totalSeats;
    private Integer currentSeats;
    private String lawBasis;
    private Boolean isActive;
}
