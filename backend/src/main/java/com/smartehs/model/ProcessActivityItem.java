package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessActivityItem {
    private Long id;
    private Long processId;
    private Integer itemNo;
    private String workContent;
    private Boolean excludeEval;
    private String applicableLaw;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
