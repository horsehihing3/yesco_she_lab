package com.smartehs.dto.response;

import com.smartehs.model.RadDrill;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** RadDrill raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadDrillResponse {
    private Long id;
    private LocalDate drillDate;
    private String drillType;
    private String scenario;
    private Integer participants;
    private String ownerName;
    private String result;
    private String improvement;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static RadDrillResponse from(RadDrill e) {
        return RadDrillResponse.builder()
                .id(e.getId())
                .drillDate(e.getDrillDate())
                .drillType(e.getDrillType())
                .scenario(e.getScenario())
                .participants(e.getParticipants())
                .ownerName(e.getOwnerName())
                .result(e.getResult())
                .improvement(e.getImprovement())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
