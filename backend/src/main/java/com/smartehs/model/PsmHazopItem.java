package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsmHazopItem {
    private Long id;
    private Long hazopId;
    private Integer itemNo;
    private String deviation;
    private String guideWord;
    private String cause;
    private String consequence;
    private String likelihood;
    private String severity;
    private String riskGrade;       // 저 / 중 / 고
    private String safeguard;
    private String owner;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
