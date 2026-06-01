package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItem {
    private Long id;
    private Long categoryId;
    private Integer itemNo;
    private String classification;
    private String checkItem;
    private String legalBasis;
    private String checkResult;
    private String finding;
    private String actionDeadline;
    private Boolean actionComplete;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
