package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MsdsRequest {
    @NotBlank private String msdsType;
    @NotBlank private String itemName;
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
}
