package com.smartehs.hr.client;

import com.smartehs.hr.dto.HrDeptDto;
import com.smartehs.hr.dto.HrFetchResult;
import com.smartehs.hr.dto.HrUserDto;

/**
 * SAP HR 인터페이스 호출부(포트). 연동 방식(REST / SAP JCo)이 미확정이므로
 * 호출 규약만 정의하고, 실제 구현({@code StubHrInterfaceClient})은 나중에 갈아끼운다.
 *
 * <p>구현체는 ES_RETURN(MSGTY/MSGLIN)을 포함한 {@link HrFetchResult}를 반환해야 하며,
 * 통신/조회 실패 시 MSGTY='E'로 표기한다(빈 리스트를 성공으로 위장하지 말 것).
 */
public interface HrInterfaceClient {

    /**
     * 사용자정보 수신.
     * @param baseDate 기준일자 (yyyyMMdd)
     * @param status   조회 상태 필터 (정의서 기준, null이면 전체)
     */
    HrFetchResult<HrUserDto> fetchUsers(String baseDate, String status);

    /**
     * 부서정보 수신.
     * @param baseDate 기준일자 (yyyyMMdd)
     */
    HrFetchResult<HrDeptDto> fetchDepartments(String baseDate);
}
