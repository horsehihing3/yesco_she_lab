package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeInoutRequest {
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
}
