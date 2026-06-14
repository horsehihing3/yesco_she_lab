package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NearMissRequest {

    private String incidentType;

    private Long workPlaceId;

    // 제목: 화면 입력란·표시 없는 레거시 필드 → 필수 해제(빈값 허용). 비면 빈 문자열로 저장됨.
    private String occTitle;

    private LocalDateTime occDate;

    private String occSite;

    private String occFloor;

    private String occSiteInfo;

    private Double occSiteX;

    private Double occSiteY;

    private Long occImageFileId;

    private String occInfo;

    private String company;

    private String authorName;

    private String authorEmail;

    private String authorDept;

    private Integer intensity;

    private Integer frequency;

    private String status;

    private List<NearMissActionRequest> actions;
}
