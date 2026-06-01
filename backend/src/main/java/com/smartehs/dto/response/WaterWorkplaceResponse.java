package com.smartehs.dto.response;

import com.smartehs.model.WaterWorkplace;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterWorkplaceResponse {
    private Long id;
    private String workplaceName;
    private String region;
    private String manager;
    private String remark;
    private String regUser;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WaterWorkplaceResponse from(WaterWorkplace entity) {
        return WaterWorkplaceResponse.builder()
                .id(entity.getId())
                .workplaceName(entity.getWorkplaceName())
                .region(entity.getRegion())
                .manager(entity.getManager())
                .remark(entity.getRemark())
                .regUser(entity.getRegUser())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
