package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WemFactorRequest {
    @NotBlank(message = "Factor name is required")
    private String factorName;
    private String factorNameEn;
    private String casNumber;
    private String factorType;
    private String twa;
    private String stel;
    private String ceilingValue;
    private String unit;
    private Boolean msdsLinked;
    private Boolean isPermitted;
    private String usedProcess;
    private String remarks;
}
