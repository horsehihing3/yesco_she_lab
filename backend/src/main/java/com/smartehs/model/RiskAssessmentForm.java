package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentForm {
    private Long id;
    private String title;
    private String description;
    private String regUser;
    private String modUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
