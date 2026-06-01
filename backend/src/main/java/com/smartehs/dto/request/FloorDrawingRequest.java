package com.smartehs.dto.request;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorDrawingRequest {
    private Long workPlaceId;
    private String name;
    private String site;
    private String floor;
    private String imagePath;
    private String description;
    private Boolean active;
    private List<SafetyDeviceRequest> devices;
}
