package com.smartehs.dto.request;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalHazardReportRequest {
    private Integer reportYear;
    private String chemicalName;
    private String casNumber;
    private String hazardClass;
    private String annualHandling;
    private String handlingFacility;
    private LocalDate reportDeadline;
    private LocalDate submitDate;
    private String status;
}
