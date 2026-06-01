package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistInspectionResult {
    private Long id;
    private Long inspectionId;
    private Long itemId;
    private String result;
    private LocalDate actionDeadline;
    private String personInCharge;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
