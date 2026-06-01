package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemFactor {
    private Long id;
    private String factorName;
    private String factorNameEn;
    private String casNumber;
    private String factorType;
    private String twa;
    private String stel;
    private String ceilingValue;
    private String unit;
    private Boolean msdsLinked;
    private Boolean isPermitted;
    private String usedProcess;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
