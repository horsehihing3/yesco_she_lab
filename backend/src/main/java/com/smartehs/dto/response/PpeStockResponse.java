package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeStock;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeStockResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private String location;
    private Integer quantity;
    private Integer minQty;
    private Integer optQty;
    private LocalDate expiryDate;
    private String note;

    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;

    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static PpeStockResponse from(PpeStock e) {
        return PpeStockResponse.builder()
                .id(e.getId())
                .itemId(e.getItemId())
                .itemName(e.getItemName())
                .location(e.getLocation())
                .quantity(e.getQuantity())
                .minQty(e.getMinQty())
                .optQty(e.getOptQty())
                .expiryDate(e.getExpiryDate())
                .note(e.getNote())
                .createdByUserId(PersonRef.userId(e.getCreatedBy()))
                .createdByName(PersonRef.name(e.getCreatedBy()))
                .createdByTeam(PersonRef.team(e.getCreatedBy()))
                .createdByPosition(PersonRef.position(e.getCreatedBy()))
                .modifiedByUserId(PersonRef.userId(e.getModifiedBy()))
                .modifiedByName(PersonRef.name(e.getModifiedBy()))
                .modifiedByTeam(PersonRef.team(e.getModifiedBy()))
                .modifiedByPosition(PersonRef.position(e.getModifiedBy()))
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
