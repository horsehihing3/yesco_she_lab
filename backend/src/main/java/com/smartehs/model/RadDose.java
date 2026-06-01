package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadDose {
    private Long id;
    private Long workerId;
    private String workerName;
    private String dept;
    private String measureMonth;
    private String dosimeterType;
    private BigDecimal effectiveDose;
    private BigDecimal handDose;
    private BigDecimal lensDose;
    private String measureOrg;
    private String confirmNo;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
