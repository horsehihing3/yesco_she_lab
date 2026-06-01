package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FireFacility {
    private Long id;
    private String mgmtNo;
    private String name;
    private String category;
    private String spec;
    private String qty;
    private String location;
    private LocalDate installDate;
    private String maker;
    private String makerNo;
    private String installer;
    private String lawBasis;
    private String checkCycle;
    private LocalDate lastCheck;
    private LocalDate nextCheck;
    private String status;
    private String mgrName;
    private BigDecimal acquirePrice;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
