package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeItemRequest {
    private String itemCode;
    private String name;
    private String category;
    private String modelNo;
    private String kcCertNo;
    private String grade;
    private String supplier;
    private Integer unitPrice;
    private Integer replaceCycle;
    private LocalDate certExpiry;
    private Integer minStock;
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
