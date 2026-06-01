package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyEducationAttendee {
    private Long id;
    private String educationId;
    private String attendeeName;
    private String attendeeEmail;
    private String attendeeDept;
    private String attendeeCompany;
    private String employeeId;
    private Boolean isSigned;
    private LocalDateTime signatureDate;
    private LocalDateTime createdAt;
}
