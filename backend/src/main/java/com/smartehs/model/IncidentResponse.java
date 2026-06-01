package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IncidentResponse {
    private Long id;
    private String responseId;
    private String title;
    private String incidentType;
    private String status;
    private String severity;
    private String location;
    private LocalDateTime reportedAt;
    private Boolean isDrill;
    private String reporter;
    private String description;
    private String actionTaken;
    private String casualtyInfo;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
