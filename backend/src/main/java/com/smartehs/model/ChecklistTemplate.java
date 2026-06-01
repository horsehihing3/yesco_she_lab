package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplate {
    private Long id;
    private String templateName;
    private String description;
    private String categoryType;
    private String note;
    private String resultOptions;
    private Integer sortOrder;
    private Boolean isActive;
    private String inspectorName;
    private String inspectorSign;
    private String inspectorSignDate;
    private String reviewerName;
    private String reviewerSign;
    private String reviewerSignDate;
    private String approverName;
    private String approverSign;
    private String approverSignDate;
    private Integer itemCount;
    private String regUser;
    private String modUser;
    private Boolean isPrivate;
    private String ownerType;
    private Long ownerId;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
