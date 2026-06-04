package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OSHCommitteeAttendee {
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
    private String signatureImage;
    private LocalDateTime createdAt;
}
