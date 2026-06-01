package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalTsca {
    private Long id;
    private String chemicalName;
    private String casNumber;
    private String inventoryStatus;
    private String regulationSection;
    private String reportingDuty;
    private String exportToUs;
    private String pmnRequired;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
