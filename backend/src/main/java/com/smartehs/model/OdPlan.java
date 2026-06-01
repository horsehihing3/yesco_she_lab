package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdPlan {
    private Long id;
    private String half;
    private String orgName;
    private String method;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer targetCount;
    private String hazardFactors;
    private String mgr;
    private String status;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
