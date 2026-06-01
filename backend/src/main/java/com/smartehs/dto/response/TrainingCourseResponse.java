package com.smartehs.dto.response;

import com.smartehs.model.TrainingCourse;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingCourseResponse {
    private Long id;
    private String courseCode;
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
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static TrainingCourseResponse from(TrainingCourse e) {
        return TrainingCourseResponse.builder()
                .id(e.getId())
                .courseCode(e.getCourseCode())
                .courseName(e.getCourseName())
                .category(e.getCategory())
                .catType(e.getCatType())
                .targetAudience(e.getTargetAudience())
                .durationHours(e.getDurationHours())
                .cycle(e.getCycle())
                .legalRequired(e.getLegalRequired())
                .instructor(e.getInstructor())
                .description(e.getDescription())
                .dateStart(e.getDateStart())
                .dateEnd(e.getDateEnd())
                .location(e.getLocation())
                .mode(e.getMode())
                .status(e.getStatus())
                .totalSeats(e.getTotalSeats())
                .currentSeats(e.getCurrentSeats())
                .lawBasis(e.getLawBasis())
                .isActive(e.getIsActive())
                .createdBy(e.getCreatedBy())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
