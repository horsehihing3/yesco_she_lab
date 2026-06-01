package com.smartehs.dto.response;

import com.smartehs.model.ChecklistInspectionResult;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistInspectionResultResponse {
    private Long id;
    private Long inspectionId;
    private Long itemId;
    private String result;
    private LocalDate actionDeadline;
    private String personInCharge;
    private String remark;

    public static ChecklistInspectionResultResponse from(ChecklistInspectionResult entity) {
        return ChecklistInspectionResultResponse.builder()
                .id(entity.getId())
                .inspectionId(entity.getInspectionId())
                .itemId(entity.getItemId())
                .result(entity.getResult())
                .actionDeadline(entity.getActionDeadline())
                .personInCharge(entity.getPersonInCharge())
                .remark(entity.getRemark())
                .build();
    }
}
