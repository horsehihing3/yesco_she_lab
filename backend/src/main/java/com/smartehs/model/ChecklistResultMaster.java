package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistResultMaster {
    private Long id;
    private String title;
    private LocalDate checkDate;
    private String checker;
    private String checkManager;
    private String facilityManager;
    private Long templateId;
    private String regUser;
    private String modUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
