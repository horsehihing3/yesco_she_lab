package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalFilter {
    private Long id;
    private String allowedLaws;          // 개행 구분 키워드. law_name 이 키워드를 포함하면 매칭
    private LocalDateTime updatedAt;
}
