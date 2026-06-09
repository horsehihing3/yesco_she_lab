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
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
