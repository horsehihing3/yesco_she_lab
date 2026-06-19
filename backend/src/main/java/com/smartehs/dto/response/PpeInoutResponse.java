package com.smartehs.dto.response;

import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeInout;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeInoutResponse {
    private Long id;
    private LocalDate inoutDate;
    private Long itemId;
    private String itemName;
    private String inoutType;
    private Integer quantity;
    private String location;
    private LocalDate expiryDate;
    private String manager;
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

    public static PpeInoutResponse from(PpeInout e) {
        return PpeInoutResponse.builder()
                .id(e.getId())
                .inoutDate(e.getInoutDate())
                .itemId(e.getItemId())
                .itemName(e.getItemName())
                .inoutType(e.getInoutType())
                .quantity(e.getQuantity())
                .location(e.getLocation())
                .expiryDate(e.getExpiryDate())
                .manager(e.getManager())
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
