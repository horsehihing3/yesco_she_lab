package com.smartehs.dto.response;

import com.smartehs.model.HealthCheckupDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupDetailResponse {
    private Long id;
    private String checkupId;
    private String bodyPart;
    private String category;
    private String resultValue;
    private String referenceRange;
    private String resultStatus;
    private String notes;
    private LocalDateTime createdAt;

    public static HealthCheckupDetailResponse from(HealthCheckupDetail entity) {
        return HealthCheckupDetailResponse.builder()
                .id(entity.getId())
                .checkupId(entity.getCheckupId())
                .bodyPart(entity.getBodyPart())
                .category(entity.getCategory())
                .resultValue(entity.getResultValue())
                .referenceRange(entity.getReferenceRange())
                .resultStatus(entity.getResultStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
