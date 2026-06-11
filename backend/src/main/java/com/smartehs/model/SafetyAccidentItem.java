package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyAccidentItem {
    private Long id;
    private Long formId;
    private Integer itemNo;
    private String accidentCase;        // 발생사례
    private String accidentType;        // 재해형태
    private Integer nearMiss;           // 아차사고 (건수)
    private Integer fatalAccident;      // 사망자 발생 (건수)
    private Integer leaveOver1month;    // 1개월 이상 (건수)
    private Integer leaveUnder1month;   // 1개월 미만 (건수)
    private Integer noLeave;            // 없음 (건수)
    private String frequency;           // 발생주기
    private String processActivity;     // 해당 공정/활동
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
