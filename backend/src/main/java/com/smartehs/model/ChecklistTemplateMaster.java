package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplateMaster {
    private Long id;
    private String title;
    private String checkDate;
    private String checker;
    private String checkManager;
    private String facilityManager;
    private String regUser;
    private String modUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
