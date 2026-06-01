package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistInspectionResultRequest {
    private Long itemId;
    private String result;
    private LocalDate actionDeadline;
    private String personInCharge;
    private String remark;
}
