package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalLotTracking {
    private Long id;
    private String lotNumber;
    private String chemicalName;
    private LocalDate incomingDate;
    private String incomingQuantity;
    private String currentLocation;
    private String usedQuantity;
    private String remainingQuantity;
    private Integer elapsedDays;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
