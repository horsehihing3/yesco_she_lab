package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NearMissRequest {

    private String incidentType;

    private Long workPlaceId;

    @NotBlank(message = "Title is required")
    private String occTitle;

    private LocalDateTime occDate;

    private String occSite;

    private String occFloor;

    private String occSiteInfo;

    private Double occSiteX;

    private Double occSiteY;

    private Long occImageFileId;

    private String occInfo;

    private String company;

    private String authorName;

    private String authorEmail;

    private String authorDept;

    private Integer intensity;

    private Integer frequency;

    private String status;

    private List<NearMissActionRequest> actions;
}
