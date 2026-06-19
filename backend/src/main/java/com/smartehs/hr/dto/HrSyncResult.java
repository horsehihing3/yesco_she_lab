package com.smartehs.hr.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 동기화 1회 실행 결과. tb_hr_sync_log 적재 및 호출자 반환용.
 */
@Data
@Builder
public class HrSyncResult {

    /** 대상 구분: "DEPT" / "USER" */
    private String target;

    /** 성공 여부 (ES_RETURN MSGTY=='S' 이고 적재 완료) */
    private boolean success;

    /** 수신 건수 */
    private int received;

    /** upsert(신규+갱신) 처리 건수 */
    private int upserted;

    /** 보호/스킵 건수 (출처='SHE' 보호 등으로 미반영) */
    private int skipped;

    /** 결과 메시지 (ES_RETURN MSGLIN 포함) */
    private String message;
}
