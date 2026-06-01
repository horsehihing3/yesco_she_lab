package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorEvalTemplate {
    private Long id;
    private String templateName;
    private String description;
    private Integer sortOrder;
    private Boolean isActive;
    private Integer itemCount;
    // 시그니처 (슬라이드 3 - 외주관리 체크리스트)
    private String evaluatorName;
    private String evaluatorSign;
    private String approverName;
    private String approverSign;
    private LocalDate signDate;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
