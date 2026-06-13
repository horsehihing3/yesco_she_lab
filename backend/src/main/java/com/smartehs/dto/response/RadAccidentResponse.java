package com.smartehs.dto.response;

import com.smartehs.model.RadAccident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** RadAccident raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadAccidentResponse {
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

    public static RadAccidentResponse from(RadAccident e) {
        return RadAccidentResponse.builder()
                .id(e.getId())
                .accidentDate(e.getAccidentDate())
                .accidentType(e.getAccidentType())
                .location(e.getLocation())
                .cause(e.getCause())
                .response(e.getResponse())
                .nrscReported(e.getNrscReported())
                .reportedAt(e.getReportedAt())
                .status(e.getStatus())
                .note(e.getNote())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
