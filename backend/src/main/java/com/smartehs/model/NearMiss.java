package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearMiss {
    private Long id;
    private String nearMissId;
    private String incidentType;
    private Long workPlaceId;
    private String workPlaceName; // JOIN from workplace table
    private String occTitle;
    private String occTitleEn;
    private String occTitleZh;
    private LocalDateTime occDate;
    private String occSite;
    private String occFloor;
    private String occSiteInfo;
    private String occInfo;
    private String occInfoEn;
    private String occInfoZh;
    private String company;
    private String authorName;
    private String authorEmail;
    private String authorDept;
    private Double occSiteX;
    private Double occSiteY;
    private Long occImageFileId;
    private Integer intensity;
    private Integer frequency;
    private String status;
    // 사고 대응 분류 — 사고/아차사고 등록 시 같이 받는 코드 4종
    private String emergencyType;   // INCIDENT_RESP_TYPE
    private String responseStatus;  // INCIDENT_RESP_STATUS — 기존 status 와 별개
    private Boolean isDrill;        // 구분 (true=훈련)
    private String severity;        // INCIDENT_RESP_SEVERITY
    private Boolean deleted;
    private Boolean isExist;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
