package com.smartehs.dto.response;

import com.smartehs.model.OdmFollowup;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmFollowupResponse {
    private Long id;
    private String employeeName;
    private String judgment;
    private String actionType;
    private LocalDate actionStartDate;
    private LocalDate followupExamDate;
    private String status;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static OdmFollowupResponse from(OdmFollowup entity) {
        return OdmFollowupResponse.builder()
                .id(entity.getId())
                .employeeName(entity.getEmployeeName())
                .judgment(entity.getJudgment())
                .actionType(entity.getActionType())
                .actionStartDate(entity.getActionStartDate())
                .followupExamDate(entity.getFollowupExamDate())
                .status(entity.getStatus())
                .remarks(entity.getRemarks())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
