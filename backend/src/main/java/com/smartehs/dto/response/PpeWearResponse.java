package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeWear;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeWearResponse {
    private Long id;
    private LocalDateTime checkDatetime;
    private String workerName;
    private String department;
    private String workZone;
    private String requiredPpe;
    private String wearStatus;
    private String checker;
    private String actionTaken;
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

    public static PpeWearResponse from(PpeWear e) {
        return PpeWearResponse.builder()
                .id(e.getId())
                .checkDatetime(e.getCheckDatetime())
                .workerName(e.getWorkerName())
                .department(e.getDepartment())
                .workZone(e.getWorkZone())
                .requiredPpe(e.getRequiredPpe())
                .wearStatus(e.getWearStatus())
                .checker(e.getChecker())
                .actionTaken(e.getActionTaken())
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
