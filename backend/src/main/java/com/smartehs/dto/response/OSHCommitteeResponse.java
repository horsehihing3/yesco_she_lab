package com.smartehs.dto.response;

import com.smartehs.model.OSHCommittee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OSHCommitteeResponse {

    private Long id;
    private String oshId;
    private LocalDateTime oshDate;
    private Integer oshYear;
    private Integer oshQuarter;
    private String oshLocation;
    private String oshLocationDetail;
    private Integer attendeeCount;
    private String mainAgenda;
    private String comment;
    private Boolean isFileCreated;
    private String authorName;
    private String authorMail;
    private String authorDept;
    private String authorCompany;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<OSHCommitteeAttendeeResponse> attendees;

    public static OSHCommitteeResponse from(OSHCommittee entity) {
        return OSHCommitteeResponse.builder()
                .id(entity.getId())
                .oshId(entity.getOshId())
                .oshDate(entity.getOshDate())
                .oshYear(entity.getOshYear())
                .oshQuarter(entity.getOshQuarter())
                .oshLocation(entity.getOshLocation())
                .oshLocationDetail(entity.getOshLocationDetail())
                .attendeeCount(entity.getAttendeeCount())
                .mainAgenda(entity.getMainAgenda())
                .comment(entity.getComment())
                .isFileCreated(entity.getIsFileCreated())
                .authorName(entity.getAuthorName())
                .authorMail(entity.getAuthorMail())
                .authorDept(entity.getAuthorDept())
                .authorCompany(entity.getAuthorCompany())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .build();
    }

    public static OSHCommitteeResponse fromWithAttendees(OSHCommittee entity, List<OSHCommitteeAttendeeResponse> attendees) {
        OSHCommitteeResponse response = from(entity);
        response.setAttendees(attendees);
        return response;
    }
}
