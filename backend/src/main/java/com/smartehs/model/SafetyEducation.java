package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyEducation {
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
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
