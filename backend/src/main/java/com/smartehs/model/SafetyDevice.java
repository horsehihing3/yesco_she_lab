package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyDevice {
    private Long id;
    private Long floorDrawingId;
    private Long imageFileId;
    private String deviceType;  // extinguisher, exit, aed, cctv, hazard
    private String name;
    private Integer positionX;
    private Integer positionY;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
