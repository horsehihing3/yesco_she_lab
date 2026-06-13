package com.smartehs.dto.response;

import com.smartehs.model.RadZone;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** RadZone raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadZoneResponse {
    private Long id;
    private String name;
    private String zoneType;
    private String location;
    private BigDecimal areaM2;
    private String measureCycle;
    private String ownerName;
    private String relatedSource;
    private String standardValue;
    private String accessRule;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static RadZoneResponse from(RadZone e) {
        return RadZoneResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .zoneType(e.getZoneType())
                .location(e.getLocation())
                .areaM2(e.getAreaM2())
                .measureCycle(e.getMeasureCycle())
                .ownerName(e.getOwnerName())
                .relatedSource(e.getRelatedSource())
                .standardValue(e.getStandardValue())
                .accessRule(e.getAccessRule())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
