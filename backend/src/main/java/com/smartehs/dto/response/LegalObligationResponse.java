package com.smartehs.dto.response;

import com.smartehs.model.LegalObligation;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalObligationResponse {
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
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static LegalObligationResponse from(LegalObligation e) {
        return LegalObligationResponse.builder()
                .id(e.getId())
                .obligationType(e.getObligationType())
                .category(e.getCategory())
                .obligationName(e.getObligationName())
                .baseLaw(e.getBaseLaw())
                .cycle(e.getCycle())
                .dept(e.getDept())
                .ownerName(e.getOwnerName())
                .dueDate(e.getDueDate())
                .nextDueDate(e.getNextDueDate())
                .status(e.getStatus())
                .progress(e.getProgress())
                .evidence(e.getEvidence())
                .penalty(e.getPenalty())
                .icon(e.getIcon())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
