package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WasteCompliance {
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
}
