package com.smartehs.dto.response;

import lombok.*;

import java.util.List;

/**
 * 법제처 국가법령정보센터 OpenAPI 검색 응답 — 클라이언트에 노출하는 형태로 정규화
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalSearchResult {
    private int totalCount;
    private int page;
    private int size;
    private List<Item> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {
        private String lawId;            // 법령일련번호 (법령ID)
        private String lawName;          // 법령명한글
        private String lawType;          // 법령구분명 (법률/시행령/시행규칙 등)
        private String competentOrg;     // 소관부처명
        private String promulgationNo;   // 공포번호
        private String promulgationDt;   // 공포일자
        private String enforceDt;        // 시행일자
        private String revisionType;     // 제·개정구분명 (일부개정/전부개정 등)
        private String detailLink;       // 상세 링크
    }
}
