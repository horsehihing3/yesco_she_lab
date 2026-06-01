package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessActivityProcess {
    private Long id;
    private Long formId;
    private String majorCategory;
    private String middleCategory;
    private String subCategory;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
