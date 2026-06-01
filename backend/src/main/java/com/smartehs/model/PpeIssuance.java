package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeIssuance {
    private Long id;
    private String issuanceId;
    private String employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Long workPlaceId;
    private String ppeType;
    private String ppeTypeEn;
    private String ppeTypeZh;
    private String ppeName;
    private String ppeModel;
    private Long ppeImageFileId;
    private Integer quantity;
    private LocalDate issuanceDate;
    private LocalDate expiryDate;
    private String hazardousFactor;
    private String issuanceReason;
    private Boolean receivedSignature;
    private LocalDateTime signatureDate;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
