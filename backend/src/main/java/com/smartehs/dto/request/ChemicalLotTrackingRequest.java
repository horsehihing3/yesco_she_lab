package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalLotTrackingRequest {
    @NotBlank private String chemicalName;
    private LocalDate incomingDate;
    private String incomingQuantity;
    private String currentLocation;
    private String usedQuantity;
    private String remainingQuantity;
    private Integer elapsedDays;
    private String status;
}
