package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdAftercare {
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
}
