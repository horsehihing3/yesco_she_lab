package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DisasterFacility {
    private Long id;
    private String mgmtNo;
    private String name;
    private String facType;
    private String location;
    private String capacity;
    private String material;
    private String chemical;
    private LocalDate installDate;
    private String checkCycle;
    private LocalDate lastCheck;
    private LocalDate nextCheck;
    private String status;
    private String mgrName;
    private String lawBasis;
    private String interlock;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
