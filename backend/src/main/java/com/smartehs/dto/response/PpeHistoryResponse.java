package com.smartehs.dto.response;

import com.smartehs.model.PpeHistory;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeHistoryResponse {
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
    private LocalDateTime createdAt;

    public static PpeHistoryResponse from(PpeHistory entity) {
        return PpeHistoryResponse.builder()
                .id(entity.getId())
                .historyId(entity.getHistoryId())
                .actionType(entity.getActionType())
                .itemName(entity.getItemName())
                .quantity(entity.getQuantity())
                .recipientName(entity.getRecipientName())
                .recipientDept(entity.getRecipientDept())
                .handlerName(entity.getHandlerName())
                .actionDate(entity.getActionDate())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
