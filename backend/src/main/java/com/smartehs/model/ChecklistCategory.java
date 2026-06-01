package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistCategory {
    private Long id;
    private Long templateId;
    private String categoryName;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
