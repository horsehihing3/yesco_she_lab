package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalRegistry {
    private Long id;
    private String lawId;            // 법제처 법령일련번호
    private String lawName;
    private String lawType;          // 법률/시행령/시행규칙/고시
    private String category;         // 안전/보건/환경/화학물질/소방
    private String competentOrg;     // 소관부처
    private String promulgationNo;   // 공포번호
    private String promulgationDt;   // 공포일자
    private String enforceDt;        // 시행일자
    private String status;           // ACTIVE/PENDING/ABOLISHED
    private String detailLink;
    private String memo;
    private Long createdByUserId;
    private String createdByName;
    private String createdByTeam;
    private String createdByPosition;
    private Long modifiedByUserId;
    private String modifiedByName;
    private String modifiedByTeam;
    private String modifiedByPosition;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
