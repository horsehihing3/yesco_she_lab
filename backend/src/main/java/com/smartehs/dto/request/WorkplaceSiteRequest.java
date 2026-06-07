package com.smartehs.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkplaceSiteRequest {
    private String siteName;
    private String siteCode;
    private String siteType;
    private String industry;
    private String address;
    private String businessRegNo;
    private String sheManager;
    private LocalDate establishedDate;
    private String representativeContact;
    private String riskGrade;
    private String operationStatus;
    private String notes;
}
