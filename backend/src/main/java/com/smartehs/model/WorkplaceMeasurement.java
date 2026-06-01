package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkplaceMeasurement {
    private Long id;
    private String measurementId;
    private Long workPlaceId;
    private Integer measurementYear;
    private String measurementHalf;
    private LocalDate measurementDate;
    private String measurementAgency;
    private String measurementSite;
    private String measurementSiteDetail;
    private String status;
    private String overallResult;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
