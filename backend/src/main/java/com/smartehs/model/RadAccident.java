package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadAccident {
    private Long id;
    private LocalDate accidentDate;
    private String accidentType;
    private String location;
    private String cause;
    private String response;
    private Boolean nrscReported;
    private LocalDateTime reportedAt;
    private String status;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
