package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalUsageReport {
    private Long id;
    private Integer reportYear;
    private String chemicalName;
    private String casNumber;
    private BigDecimal annualUsage;
    private String unit;
    private String usagePurpose;
    private LocalDate reportDeadline;
    private LocalDate submitDate;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
