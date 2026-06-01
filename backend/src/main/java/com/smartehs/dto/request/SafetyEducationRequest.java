package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SafetyEducationRequest {

    private Long workPlaceId;

    @NotBlank(message = "Title is required")
    private String title;

    private String titleEn;
    private String titleZh;

    @NotBlank(message = "Education type is required")
    private String educationType;

    private String educationCategory;

    @NotNull(message = "Education date is required")
    private LocalDate educationDate;

    private BigDecimal educationHours;
    private String location;
    private String instructorName;
    private String instructorOrg;
    private String hazardousFactors;
    private String educationContent;
    private String status;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;

    private List<SafetyEducationAttendeeRequest> attendees;
}
