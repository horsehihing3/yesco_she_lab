package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkPlaceRequest {

    private String title;

    @NotBlank(message = "Place is required")
    private String place;

    private String floor;

    private Boolean used;

    private String company;

    private String coordinate;

    private String imagePath;
}
