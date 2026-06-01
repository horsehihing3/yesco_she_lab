package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WasteComplianceRequest {
    private String checkDate;
    private String regulationName;
    private String checkItem;
    private String status;
    private String violationDetails;
    private String correctiveAction;
    private String actionDeadline;
    private String responsiblePerson;
    private String actionStatus;
}
