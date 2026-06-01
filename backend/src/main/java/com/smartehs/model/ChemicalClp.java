package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalClp {
    private Long id;
    private String chemicalName;
    private String casNumber;
    private String clpClassification;
    private String signalWord;
    private String hCodes;
    private String pCodes;
    private LocalDate lastUpdated;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
