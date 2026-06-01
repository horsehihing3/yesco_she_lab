package com.smartehs.dto.response;

import com.smartehs.model.WasteCompliance;
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
public class WasteComplianceResponse {
    private Long id;
    private LocalDate checkDate;
    private String regulationName;
    private String checkItem;
    private String status;
    private String violationDetails;
    private String correctiveAction;
    private LocalDate actionDeadline;
    private String responsiblePerson;
    private String actionStatus;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WasteComplianceResponse from(WasteCompliance entity) {
        return WasteComplianceResponse.builder()
                .id(entity.getId())
                .checkDate(entity.getCheckDate())
                .regulationName(entity.getRegulationName())
                .checkItem(entity.getCheckItem())
                .status(entity.getStatus())
                .violationDetails(entity.getViolationDetails())
                .correctiveAction(entity.getCorrectiveAction())
                .actionDeadline(entity.getActionDeadline())
                .responsiblePerson(entity.getResponsiblePerson())
                .actionStatus(entity.getActionStatus())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
