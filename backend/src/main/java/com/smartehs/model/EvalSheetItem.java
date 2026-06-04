package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvalSheetItem {
    private Long id;
    private Long metaId;            // 소속 평가표 (tb_eval_sheet_meta.id)
    private Integer sortOrder;
    private String category;
    private String evalItem;
    private String evalContent;
    private BigDecimal maxScore;
    private BigDecimal score;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
