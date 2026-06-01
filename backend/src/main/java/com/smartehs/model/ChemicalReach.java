package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalReach {
    private Long id;
    private String chemicalName;
    private String casNumber;
    private String registrationNo;
    private String svhc;
    private String authorizationRequired;
    private String restrictionNote;
    private LocalDate registrationDate;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
