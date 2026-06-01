package com.smartehs.dto.response;

import com.smartehs.model.WorkPlace;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkPlaceResponse {

    private Long id;
    private String title;
    private String place;
    private String floor;
    private Boolean used;
    private String company;
    private String coordinate;
    private String imagePath;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static WorkPlaceResponse from(WorkPlace entity) {
        return WorkPlaceResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .place(entity.getPlace())
                .floor(entity.getFloor())
                .used(entity.getUsed())
                .company(entity.getCompany())
                .coordinate(entity.getCoordinate())
                .imagePath(entity.getImagePath())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }
}
