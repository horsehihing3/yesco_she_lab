package com.smartehs.dto.response;

import com.smartehs.model.SafetyEducation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyEducationResponse {
    private Long id;
    private String educationId;
    private Long workPlaceId;
    private String title;
    private String titleEn;
    private String titleZh;
    private String educationType;
    private String educationCategory;
    private LocalDate educationDate;
    private BigDecimal educationHours;
    private String location;
    private String instructorName;
    private String instructorOrg;
    private String hazardousFactors;
    private String educationContent;
    private Integer attendeeCount;
    private String status;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<SafetyEducationAttendeeResponse> attendees;

    public static SafetyEducationResponse from(SafetyEducation entity) {
        return SafetyEducationResponse.builder()
                .id(entity.getId())
                .educationId(entity.getEducationId())
                .workPlaceId(entity.getWorkPlaceId())
                .title(entity.getTitle())
                .titleEn(entity.getTitleEn())
                .titleZh(entity.getTitleZh())
                .educationType(entity.getEducationType())
                .educationCategory(entity.getEducationCategory())
                .educationDate(entity.getEducationDate())
                .educationHours(entity.getEducationHours())
                .location(entity.getLocation())
                .instructorName(entity.getInstructorName())
                .instructorOrg(entity.getInstructorOrg())
                .hazardousFactors(entity.getHazardousFactors())
                .educationContent(entity.getEducationContent())
                .attendeeCount(entity.getAttendeeCount())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
