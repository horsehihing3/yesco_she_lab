package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeHistory {
    private Long id;
    private String historyId;
    private String actionType;
    private String itemName;
    private Integer quantity;
    private String recipientName;
    private String recipientDept;
    private String handlerName;
    private LocalDateTime actionDate;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
