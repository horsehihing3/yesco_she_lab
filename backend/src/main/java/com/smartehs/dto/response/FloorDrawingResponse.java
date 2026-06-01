package com.smartehs.dto.response;

import com.smartehs.model.FloorDrawing;
import com.smartehs.model.SafetyDevice;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorDrawingResponse {
    private Long id;
    private Long workPlaceId;
    private String name;
    private String site;
    private String floor;
    private String imagePath;
    private String description;
    private Boolean active;
    private List<SafetyDeviceResponse> devices;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static FloorDrawingResponse from(FloorDrawing floorDrawing) {
        return FloorDrawingResponse.builder()
                .id(floorDrawing.getId())
                .workPlaceId(floorDrawing.getWorkPlaceId())
                .name(floorDrawing.getName())
                .site(floorDrawing.getSite())
                .floor(floorDrawing.getFloor())
                .imagePath(floorDrawing.getImagePath())
                .description(floorDrawing.getDescription())
                .active(floorDrawing.getActive())
                .createdAt(floorDrawing.getCreatedAt())
                .modifiedAt(floorDrawing.getModifiedAt())
                .build();
    }

    public static FloorDrawingResponse from(FloorDrawing floorDrawing, List<SafetyDevice> devices) {
        FloorDrawingResponse response = from(floorDrawing);
        if (devices != null) {
            response.setDevices(devices.stream()
                    .map(SafetyDeviceResponse::from)
                    .collect(Collectors.toList()));
        }
        return response;
    }
}
