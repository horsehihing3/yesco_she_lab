package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FireContact {
    private Long id;
    private String orgType;
    private String orgName;
    private String mainTel;
    private String emergencyTel;
    private String mgrName;
    private String mgrMobile;
    private String contractPeriod;
    private String coverage;
    private String note;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
