package com.smartehs.dto.response;

import com.smartehs.model.OdFitness;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdFitnessResponse {
    private Long id;
    private String workerName;
    private String dept;
    private String disease;
    private LocalDate evalDate;
    private String evalOrg;
    private String evalResult;
    private String recommendation;
    private String doneStatus;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdFitnessResponse from(OdFitness e) {
        return OdFitnessResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .dept(e.getDept())
                .disease(e.getDisease())
                .evalDate(e.getEvalDate())
                .evalOrg(e.getEvalOrg())
                .evalResult(e.getEvalResult())
                .recommendation(e.getRecommendation())
                .doneStatus(e.getDoneStatus())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
