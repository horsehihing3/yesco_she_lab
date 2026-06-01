package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FirePlan {
    private Long id;
    private String planType;
    private String lawBasis;
    private String cycle;
    private LocalDate planDate;
    private String org;
    private String target;
    private String cost;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
