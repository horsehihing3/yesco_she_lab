package com.smartehs.dto.response;

import com.smartehs.model.SafetyEducationAttendee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyEducationAttendeeResponse {
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

    public static SafetyEducationAttendeeResponse from(SafetyEducationAttendee entity) {
        return SafetyEducationAttendeeResponse.builder()
                .id(entity.getId())
                .educationId(entity.getEducationId())
                .attendeeName(entity.getAttendeeName())
                .attendeeEmail(entity.getAttendeeEmail())
                .attendeeDept(entity.getAttendeeDept())
                .attendeeCompany(entity.getAttendeeCompany())
                .employeeId(entity.getEmployeeId())
                .isSigned(entity.getIsSigned())
                .signatureDate(entity.getSignatureDate())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
