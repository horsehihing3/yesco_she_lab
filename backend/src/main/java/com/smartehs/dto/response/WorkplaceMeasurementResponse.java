package com.smartehs.dto.response;

import com.smartehs.model.WorkplaceMeasurement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkplaceMeasurementResponse {
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<WorkplaceMeasurementDetailResponse> details;

    public static WorkplaceMeasurementResponse from(WorkplaceMeasurement entity) {
        return WorkplaceMeasurementResponse.builder()
                .id(entity.getId())
                .measurementId(entity.getMeasurementId())
                .workPlaceId(entity.getWorkPlaceId())
                .measurementYear(entity.getMeasurementYear())
                .measurementHalf(entity.getMeasurementHalf())
                .measurementDate(entity.getMeasurementDate())
                .measurementAgency(entity.getMeasurementAgency())
                .measurementSite(entity.getMeasurementSite())
                .measurementSiteDetail(entity.getMeasurementSiteDetail())
                .status(entity.getStatus())
                .overallResult(entity.getOverallResult())
                .notes(entity.getNotes())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .authorDept(entity.getAuthorDept())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
