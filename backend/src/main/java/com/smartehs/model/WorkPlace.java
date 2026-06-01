package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkPlace {
    private Long id;
    private String title;
    private String place;
    private String floor;
    private Boolean used;
    private String company;
    private String coordinate;
    private String imagePath;
    private Long existId;
    private Boolean isExist;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
