package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalGhs {
    private Long id;
    private String chemicalName;
    private String casNumber;
    private String physicalHazard;
    private String healthHazard;
    private String environmentalHazard;
    private String signalWord;
    private String ghsVersion;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
