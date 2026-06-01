package com.smartehs.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactor {
    private Long id;
    private String energySource;
    private String unit;
    private BigDecimal factorValue;
    private Integer baseYear;
    private String referenceOrg;
    private Integer scope;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
