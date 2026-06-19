package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeStockRequest {
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
}
