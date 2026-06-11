package com.smartehs.dto.response;

import com.smartehs.model.PpeRequest;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PpeRequestResponse {
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
    private Boolean isConsumable;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeRequestResponse from(PpeRequest e) {
        return PpeRequestResponse.builder()
                .id(e.getId()).requestId(e.getRequestId()).status(e.getStatus())
                .equipmentId(e.getEquipmentId()).itemName(e.getItemName())
                .itemCategory(e.getItemCategory()).itemModel(e.getItemModel())
                .quantity(e.getQuantity()).reason(e.getReason())
                .requesterName(e.getRequesterName()).requesterDept(e.getRequesterDept())
                .requesterId(e.getRequesterId()).requestDate(e.getRequestDate())
                .approverName(e.getApproverName()).approverDept(e.getApproverDept())
                .approverId(e.getApproverId()).approvedAt(e.getApprovedAt())
                .issuedAt(e.getIssuedAt()).returnedAt(e.getReturnedAt()).rejectionReason(e.getRejectionReason())
                .notes(e.getNotes()).isConsumable(e.getIsConsumable())
                .createdAt(e.getCreatedAt()).modifiedAt(e.getModifiedAt())
                .build();
    }
}
