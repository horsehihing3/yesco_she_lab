package com.smartehs.dto.response;

import com.smartehs.model.OSHCommitteeAttendee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OSHCommitteeAttendeeResponse {

    private Long id;
    private String oshId;
    private String attendeeName;
    private String attendeeMail;
    private String attendeeDept;
    private String attendeeCompany;
    private String attendeePhone;
    private Boolean isExternal;
    private Boolean isSigned;
    private LocalDateTime signatureDate;
    private LocalDateTime createdAt;

    public static OSHCommitteeAttendeeResponse from(OSHCommitteeAttendee entity) {
        return OSHCommitteeAttendeeResponse.builder()
                .id(entity.getId())
                .oshId(entity.getOshId())
                .attendeeName(entity.getAttendeeName())
                .attendeeMail(entity.getAttendeeMail())
                .attendeeDept(entity.getAttendeeDept())
                .attendeeCompany(entity.getAttendeeCompany())
                .attendeePhone(entity.getAttendeePhone())
                .isExternal(entity.getIsExternal())
                .isSigned(entity.getIsSigned())
                .signatureDate(entity.getSignatureDate())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
