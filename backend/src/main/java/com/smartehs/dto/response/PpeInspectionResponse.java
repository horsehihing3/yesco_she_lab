package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeInspection;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeInspectionResponse {
    private Long id;
    private LocalDate inspectionDate;
    private Long itemId;
    private String itemName;
    private String itemCode;
    private String inspectionType;
    private String inspector;
    private String result;
    private LocalDate nextDate;
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

    public static PpeInspectionResponse from(PpeInspection e) {
        return PpeInspectionResponse.builder()
                .id(e.getId())
                .inspectionDate(e.getInspectionDate())
                .itemId(e.getItemId())
                .itemName(e.getItemName())
                .itemCode(e.getItemCode())
                .inspectionType(e.getInspectionType())
                .inspector(e.getInspector())
                .result(e.getResult())
                .nextDate(e.getNextDate())
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
