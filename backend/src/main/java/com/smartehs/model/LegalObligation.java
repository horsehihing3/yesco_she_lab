package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalObligation {
    private Long id;
    private String obligationType;
    private String category;
    private String obligationName;
    private String baseLaw;
    private String cycle;
    private String dept;
    private String ownerName;
    private LocalDate dueDate;
    private LocalDate nextDueDate;
    private String status;
    private Integer progress;
    private String evidence;
    private String penalty;
    private String icon;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
