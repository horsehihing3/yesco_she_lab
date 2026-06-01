package com.smartehs.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkplaceMeasurementRequest {

    private Long workPlaceId;

    @NotNull(message = "Measurement year is required")
    private Integer measurementYear;

    @NotNull(message = "Measurement half is required")
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

    private List<WorkplaceMeasurementDetailRequest> details;
}
