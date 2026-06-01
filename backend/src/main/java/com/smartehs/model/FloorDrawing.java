package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorDrawing {
    private Long id;
    private Long workPlaceId;
    private String name;
    private String site;
    private String floor;
    private String imagePath;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
