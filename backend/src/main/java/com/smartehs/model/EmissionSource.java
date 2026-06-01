package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionSource {
    private Long id;
    private String sourceCode;
    private String sourceName;
    private String sourceType;
    private Integer scope;
    private String location;
    private String status;
    private BigDecimal annualEmission;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
