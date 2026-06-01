package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PpeIssuanceRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    private String employeeName;
    private String employeeDept;
    private String employeeEmail;
    private Long workPlaceId;

    @NotBlank(message = "PPE type is required")
    private String ppeType;

    private String ppeTypeEn;
    private String ppeTypeZh;
    private String ppeName;
    private String ppeModel;
    private Long ppeImageFileId;
    private Integer quantity;

    @NotNull(message = "Issuance date is required")
    private LocalDate issuanceDate;

    private LocalDate expiryDate;
    private String hazardousFactor;
    private String issuanceReason;
    private String notes;
    private String authorName;
    private String authorEmail;
    private String authorDept;
}
