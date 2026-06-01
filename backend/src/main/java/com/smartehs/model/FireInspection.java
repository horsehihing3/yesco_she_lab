package com.smartehs.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FireInspection {
    private Long id;
    private String inspNo;
    private String inspName;
    private String inspType;
    private String org;
    private LocalDate applyDate;
    private LocalDate inspDate;
    private String inspector;
    private String result;
    private BigDecimal cost;
    private String submitStatus;
    private LocalDate submitDate;
    private String summary;
    private String issue;
    private String plan;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
