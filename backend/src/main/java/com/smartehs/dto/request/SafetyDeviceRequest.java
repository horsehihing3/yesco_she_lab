package com.smartehs.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyDeviceRequest {
    private Long id;
    private Long floorDrawingId;
    private Long imageFileId;
    private String deviceType;  // extinguisher, exit, aed, cctv, hazard
    private String name;
    private Integer positionX;
    private Integer positionY;
    private String description;
    private Boolean active;
}
