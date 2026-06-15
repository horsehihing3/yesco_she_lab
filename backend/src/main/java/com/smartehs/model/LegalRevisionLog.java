package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalRevisionLog {
    private Long id;
    private String lawId;
    private String lawName;
    private String revisionType;   // 일부개정/전부개정/신규제정/폐지/입법예고
    private String revisionNo;
    private String revisionDt;
    private String enforceDt;
    private String summary;
    private String detailLink;
    private String reviewStatus;   // PENDING/IN_REVIEW/DONE/NEED_ACTION/NO_IMPACT
    private String impactLevel;    // HIGH/MID/LOW
    private LocalDateTime fetchedAt;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
