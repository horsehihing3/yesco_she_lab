package com.smartehs.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * HR 동기화 실행 이력 (tb_hr_sync_log).
 */
@Data
@Builder
public class HrSyncLog {

    private Long id;
    private LocalDateTime executedAt;

    /** 대상 구분: DEPT / USER */
    private String target;

    /** 수신 건수 */
    private Integer receivedCount;

    /** 성공 여부 */
    private Boolean success;

    /** 메시지 (ES_RETURN MSGLIN + 처리 요약) */
    private String message;
}
