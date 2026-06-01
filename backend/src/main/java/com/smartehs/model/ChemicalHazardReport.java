package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalHazardReport {
    private Long id;
    private Integer reportYear;
    private String chemicalName;
    private String casNumber;
    private String hazardClass;
    private String annualHandling;
    private String handlingFacility;
    private LocalDate reportDeadline;
    private LocalDate submitDate;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
