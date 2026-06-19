package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpePerformance;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpePerformanceResponse {
    private Long id;
    private LocalDate evaluationDate;
    private Long itemId;
    private String itemName;
    private String performanceStandard;
    private String standardValue;
    private String measuredValue;
    private String result;
    private String evaluator;
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpePerformanceResponse from(PpePerformance e) {
        return PpePerformanceResponse.builder()
                .id(e.getId())
                .evaluationDate(e.getEvaluationDate())
                .itemId(e.getItemId())
                .itemName(e.getItemName())
                .performanceStandard(e.getPerformanceStandard())
                .standardValue(e.getStandardValue())
                .measuredValue(e.getMeasuredValue())
                .result(e.getResult())
                .evaluator(e.getEvaluator())
                .note(e.getNote())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(e.getModifiedBy()))
                .modifiedByName(PersonRef.name(e.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(e.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(e.getModifiedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
