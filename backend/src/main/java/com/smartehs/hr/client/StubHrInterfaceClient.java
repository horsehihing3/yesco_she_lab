package com.smartehs.hr.client;

import com.smartehs.hr.dto.EsReturn;
import com.smartehs.hr.dto.HrDeptDto;
import com.smartehs.hr.dto.HrFetchResult;
import com.smartehs.hr.dto.HrUserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 임시 구현체 — SAP 연동 방식(REST/JCo) 확정 전까지 사용.
 * 빈 결과(성공/0건)를 돌려주고 "미구현" 경고만 남긴다.
 * 실제 연동 시 이 클래스를 대체하는 구현체를 {@code @Primary}로 등록하거나 이 본문만 교체한다.
 */
@Slf4j
@Component
public class StubHrInterfaceClient implements HrInterfaceClient {

    private static final String STUB_MSG = "STUB: HR 인터페이스 미구현(연동방식 확정 대기) — 빈 결과 반환";

    @Override
    public HrFetchResult<HrUserDto> fetchUsers(String baseDate, String status) {
        log.warn("[HR-STUB] fetchUsers 미구현 — baseDate={}, status={}. 연동방식(REST/JCo) 확정 후 구현 교체 필요.",
                baseDate, status);
        return new HrFetchResult<>(new EsReturn("S", STUB_MSG), List.of());
    }

    @Override
    public HrFetchResult<HrDeptDto> fetchDepartments(String baseDate) {
        log.warn("[HR-STUB] fetchDepartments 미구현 — baseDate={}. 연동방식(REST/JCo) 확정 후 구현 교체 필요.",
                baseDate);
        return new HrFetchResult<>(new EsReturn("S", STUB_MSG), List.of());
    }
}
