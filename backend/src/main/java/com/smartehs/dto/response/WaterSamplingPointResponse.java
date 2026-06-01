package com.smartehs.dto.response;

import com.smartehs.model.WaterSamplingPoint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterSamplingPointResponse {
    private Long id;
    private Long workplaceId;
    private String pointName;
    private String location;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private String workplaceName;

    public static WaterSamplingPointResponse from(WaterSamplingPoint entity) {
        return WaterSamplingPointResponse.builder()
                .id(entity.getId())
                .workplaceId(entity.getWorkplaceId())
                .pointName(entity.getPointName())
                .location(entity.getLocation())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static WaterSamplingPointResponse from(WaterSamplingPoint entity, String workplaceName) {
        return WaterSamplingPointResponse.builder()
                .id(entity.getId())
                .workplaceId(entity.getWorkplaceId())
                .pointName(entity.getPointName())
                .location(entity.getLocation())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .workplaceName(workplaceName)
                .build();
    }
}
