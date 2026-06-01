package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrillLog {
    private Long id;
    private Long drillId;
    private String action;
    private String changedBy;
    private String detail;
    private Integer totalCount;
    private Integer passCount;
    private Integer failCount;
    private Integer naCount;
    private LocalDateTime createdAt;
}
