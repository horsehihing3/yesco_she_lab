package com.smartehs.dto.response;

import com.smartehs.model.AccidentReport;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AccidentReport raw 엔티티 반환 대체 DTO.
 * wire(JSON) 는 raw 모델과 100% 동일하게 유지 — 프론트 무변경.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccidentReportResponse {
    private Long id;
    private String caseDescription;
    private String disasterType;
    private Boolean isNearMiss;
    private Boolean isFatal;
    private Boolean leaveOverMonth;
    private Boolean leaveUnderMonth;
    private Boolean freqNone;
    private String occurrenceCycle;
    private String relatedProcess;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static AccidentReportResponse from(AccidentReport e) {
        return AccidentReportResponse.builder()
                .id(e.getId())
                .caseDescription(e.getCaseDescription())
                .disasterType(e.getDisasterType())
                .isNearMiss(e.getIsNearMiss())
                .isFatal(e.getIsFatal())
                .leaveOverMonth(e.getLeaveOverMonth())
                .leaveUnderMonth(e.getLeaveUnderMonth())
                .freqNone(e.getFreqNone())
                .occurrenceCycle(e.getOccurrenceCycle())
                .relatedProcess(e.getRelatedProcess())
                .sortOrder(e.getSortOrder())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
