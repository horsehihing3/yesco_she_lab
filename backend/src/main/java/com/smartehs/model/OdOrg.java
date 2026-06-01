package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdOrg {
    private Long id;
    private String name;
    private String doctor;
    private String orgType;
    private String factors;
    private Integer costPerPerson;
    private LocalDate contractEnd;
    private Integer targetCount;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
