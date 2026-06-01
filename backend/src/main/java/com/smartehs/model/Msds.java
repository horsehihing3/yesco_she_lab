package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Msds {
    private Long id;
    private String msdsType;
    private String itemName;
    private String itemCode;
    private String casNumber;
    private String supplier;
    private String version;
    private LocalDate issueDate;
    private LocalDate retireDate;
    private String retireReason;
    private String language;
    private String fileSize;
    private Long fileId;
    private String exportCountries;
    private Boolean isLatest;
    private String changeType;
    private String changeSummary;
    private String registeredBy;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
