package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PartnerVisitor {
    private Long id;
    private LocalDateTime visitDt;
    private String visitorName;
    private String companyName;
    private String position;
    private String contact;
    private String purpose;
    private String area;
    private String education;
    private String ppe;
    private String checkInTime;
    private String checkOutTime;
    private String stayHours;
    private String mgrName;
    private String idNumber;
    private String status;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
