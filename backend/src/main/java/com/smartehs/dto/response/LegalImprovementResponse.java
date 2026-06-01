package com.smartehs.dto.response;

import com.smartehs.model.LegalImprovement;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalImprovementResponse {
    private Long id;
    private String improvementType;
    private String priority;
    private String title;
    private String baseLaw;
    private String description;
    private String dept;
    private String ownerName;
    private LocalDate targetDate;
    private String source;
    private String colStatus;
    private LocalDate registeredDate;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static LegalImprovementResponse from(LegalImprovement e) {
        return LegalImprovementResponse.builder()
                .id(e.getId())
                .improvementType(e.getImprovementType())
                .priority(e.getPriority())
                .title(e.getTitle())
                .baseLaw(e.getBaseLaw())
                .description(e.getDescription())
                .dept(e.getDept())
                .ownerName(e.getOwnerName())
                .targetDate(e.getTargetDate())
                .source(e.getSource())
                .colStatus(e.getColStatus())
                .registeredDate(e.getRegisteredDate())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
