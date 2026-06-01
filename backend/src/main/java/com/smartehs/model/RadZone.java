package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadZone {
    private Long id;
    private String name;
    private String zoneType;
    private String location;
    private BigDecimal areaM2;
    private String measureCycle;
    private String ownerName;
    private String relatedSource;
    private String standardValue;
    private String accessRule;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
