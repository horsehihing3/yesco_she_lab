package com.smartehs.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SAP HR 인터페이스 표준 응답 헤더 (ES_RETURN).
 * 인터페이스 정의서 확정값: MSGTY = 'S'(정상) / 'E'(에러), MSGLIN = 메시지.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EsReturn {

    /** 처리 결과 타입: 'S' 정상 / 'E' 에러 */
    private String msgty;

    /** 결과 메시지 */
    private String msglin;

    /** 성공 판정 = MSGTY == 'S' */
    public boolean isSuccess() {
        return "S".equals(msgty);
    }
}
