package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadDrill {
    private Long id;
    private LocalDate drillDate;
    private String drillType;
    private String scenario;
    private Integer participants;
    private String ownerName;
    private String result;
    private String improvement;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
