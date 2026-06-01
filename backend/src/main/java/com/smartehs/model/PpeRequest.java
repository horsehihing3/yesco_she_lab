package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PpeRequest {
    private Long id;
    private String requestId;
    private String status;
    private Long equipmentId;
    private String itemName;
    private String itemCategory;
    private String itemModel;
    private Integer quantity;
    private String reason;
    private String requesterName;
    private String requesterDept;
    private String requesterId;
    private LocalDateTime requestDate;
    private String approverName;
    private String approverDept;
    private String approverId;
    private LocalDateTime approvedAt;
    private LocalDateTime issuedAt;
    private LocalDateTime returnedAt;
    private String rejectionReason;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
