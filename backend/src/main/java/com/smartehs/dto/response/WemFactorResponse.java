package com.smartehs.dto.response;

import com.smartehs.model.WemFactor;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WemFactorResponse {
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

    public static WemFactorResponse from(WemFactor entity) {
        return WemFactorResponse.builder()
                .id(entity.getId())
                .factorName(entity.getFactorName())
                .factorNameEn(entity.getFactorNameEn())
                .casNumber(entity.getCasNumber())
                .factorType(entity.getFactorType())
                .twa(entity.getTwa())
                .stel(entity.getStel())
                .ceilingValue(entity.getCeilingValue())
                .unit(entity.getUnit())
                .msdsLinked(entity.getMsdsLinked())
                .isPermitted(entity.getIsPermitted())
                .usedProcess(entity.getUsedProcess())
                .remarks(entity.getRemarks())
                .createdByUserId(entity.getCreatedByUserId())
                .createdByName(entity.getCreatedByName())
                .createdByTeam(entity.getCreatedByTeam())
                .createdByPosition(entity.getCreatedByPosition())
                .modifiedByUserId(entity.getModifiedByUserId())
                .modifiedByName(entity.getModifiedByName())
                .modifiedByTeam(entity.getModifiedByTeam())
                .modifiedByPosition(entity.getModifiedByPosition())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
