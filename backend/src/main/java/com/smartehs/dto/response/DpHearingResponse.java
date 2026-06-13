package com.smartehs.dto.response;

import com.smartehs.model.DpHearing;
import com.smartehs.model.PersonRef;
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
public class DpHearingResponse {
    private Long id;
    private String workerName;
    private String department;
    private Integer noiseLevel;
    private Integer exposureHours;
    private Integer right4k;
    private Integer right6k;
    private Integer left4k;
    private Integer left6k;
    private String stsResult;
    private String ppeType;
    private Integer ppeNrr;
    private LocalDate examDate;
    private String examType;
    private String status;
    private String notes;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static DpHearingResponse from(DpHearing e) {
        return DpHearingResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .noiseLevel(e.getNoiseLevel())
                .exposureHours(e.getExposureHours())
                .right4k(e.getRight4k())
                .right6k(e.getRight6k())
                .left4k(e.getLeft4k())
                .left6k(e.getLeft6k())
                .stsResult(e.getStsResult())
                .ppeType(e.getPpeType())
                .ppeNrr(e.getPpeNrr())
                .examDate(e.getExamDate())
                .examType(e.getExamType())
                .status(e.getStatus())
                .notes(e.getNotes())
                .deleted(e.getDeleted())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
