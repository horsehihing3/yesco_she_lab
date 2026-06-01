package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SafetyEducationAttendeeRequest {

    private String attendeeName;
    private String attendeeEmail;
    private String attendeeDept;
    private String attendeeCompany;
    private String employeeId;
}
