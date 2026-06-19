package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeInspectionRequest {
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
}
