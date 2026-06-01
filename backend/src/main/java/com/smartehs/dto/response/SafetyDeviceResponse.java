package com.smartehs.dto.response;

import com.smartehs.model.SafetyDevice;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyDeviceResponse {
    private Long id;
    private Long floorDrawingId;
    private Long imageFileId;
    private String deviceType;
    private String name;
    private Integer positionX;
    private Integer positionY;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static SafetyDeviceResponse from(SafetyDevice device) {
        return SafetyDeviceResponse.builder()
                .id(device.getId())
                .floorDrawingId(device.getFloorDrawingId())
                .imageFileId(device.getImageFileId())
                .deviceType(device.getDeviceType())
                .name(device.getName())
                .positionX(device.getPositionX())
                .positionY(device.getPositionY())
                .description(device.getDescription())
                .active(device.getActive())
                .createdAt(device.getCreatedAt())
                .modifiedAt(device.getModifiedAt())
                .build();
    }
}
