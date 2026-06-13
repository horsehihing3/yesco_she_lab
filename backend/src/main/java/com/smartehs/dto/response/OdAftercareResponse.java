package com.smartehs.dto.response;

import com.smartehs.model.OdAftercare;
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
public class OdAftercareResponse {
    private Long id;
    private String workerName;
    private String dept;
    private String factor;
    private String judge;
    private String disease;
    private String actionsText;
    private String status;
    private Boolean urgent;
    private LocalDate dueDate;
    private Boolean deleted;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdAftercareResponse from(OdAftercare e) {
        return OdAftercareResponse.builder()
                .id(e.getId())
                .workerName(e.getWorkerName())
                .dept(e.getDept())
                .factor(e.getFactor())
                .judge(e.getJudge())
                .disease(e.getDisease())
                .actionsText(e.getActionsText())
                .status(e.getStatus())
                .urgent(e.getUrgent())
                .dueDate(e.getDueDate())
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
