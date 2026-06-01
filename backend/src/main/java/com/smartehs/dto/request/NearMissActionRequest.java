package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NearMissActionRequest {

    private String improvementMeasures;

    private String manageDept;

    private String responsiblePerson;

    private String responsiblePersonMail;

    private String responsiblePersonCompany;

    private String planDate;

    private String completeDate;
}
