package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkplaceSite {
    private Long id;
    private String buildingNumber;        // B30-0001
    private String siteName;              // 사업장명
    private String siteCode;              // 사업장코드
    private String siteType;              // 사업장유형
    private String industry;              // 업종
    private String address;               // 주소
    private String businessRegNo;         // 사업자등록번호
    private String sheManager;            // SHE담당자
    private LocalDate establishedDate;    // 설립일
    private String representativeContact; // 대표연락처
    private String riskGrade;             // 위험등급 A/B/C/D
    private String operationStatus;       // ACTIVE/SUSPENDED/CLOSED
    private String notes;                 // 비고
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
