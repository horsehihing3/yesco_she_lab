package com.smartehs.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalUsageReportRequest {
    private Integer reportYear;
    private String chemicalName;
    private String casNumber;
    private BigDecimal annualUsage;
    private String unit;
    private String usagePurpose;
    private LocalDate reportDeadline;
    private LocalDate submitDate;
    private String status;
}
