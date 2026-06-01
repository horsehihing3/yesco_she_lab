package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalRegulation {
    private Long id;
    private String regCode;
    private String regName;
    private String regType;
    private String authority;
    private Integer applicableCount;
    private LocalDate lastRevisionDate;
    private LocalDate nextReviewDate;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
