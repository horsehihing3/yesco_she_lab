package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulationCheck {
    private Long id;
    private String checkId;
    private String checkName;
    private String relatedRegulation;
    private String checkType;
    private String assignee;
    private LocalDate dueDate;
    private Integer progress;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
