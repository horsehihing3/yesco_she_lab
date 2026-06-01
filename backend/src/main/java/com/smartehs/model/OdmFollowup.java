package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdmFollowup {
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
}
