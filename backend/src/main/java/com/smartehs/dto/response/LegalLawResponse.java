package com.smartehs.dto.response;

import com.smartehs.model.LegalLaw;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalLawResponse {
    private Long id;
    private String category;
    private String lawName;
    private String clause;
    private String amendType;
    private LocalDate promulgateDate;
    private LocalDate enforceDate;
    private String reviewer;
    private LocalDate reviewDueDate;
    private String reviewStatus;
    private String applyYn;
    private String followUpAction;
    private String amendSummary;
    private Boolean urgent;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static LegalLawResponse from(LegalLaw e) {
        return LegalLawResponse.builder()
                .id(e.getId())
                .category(e.getCategory())
                .lawName(e.getLawName())
                .clause(e.getClause())
                .amendType(e.getAmendType())
                .promulgateDate(e.getPromulgateDate())
                .enforceDate(e.getEnforceDate())
                .reviewer(e.getReviewer())
                .reviewDueDate(e.getReviewDueDate())
                .reviewStatus(e.getReviewStatus())
                .applyYn(e.getApplyYn())
                .followUpAction(e.getFollowUpAction())
                .amendSummary(e.getAmendSummary())
                .urgent(e.getUrgent())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
