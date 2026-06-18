package com.smartehs.hr;

import com.smartehs.hr.client.HrInterfaceClient;
import com.smartehs.hr.dto.HrDeptDto;
import com.smartehs.hr.dto.HrFetchResult;
import com.smartehs.hr.dto.HrSyncResult;
import com.smartehs.hr.dto.HrUserDto;
import com.smartehs.mapper.HrSyncMapper;
import com.smartehs.model.HrSyncLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * HR 인사정보 동기화 핵심 로직 (수신 → ES_RETURN 확인 → 출처='SAP' 한정 upsert → 결과/이력).
 *
 * <p>스케줄러뿐 아니라 수동 호출(관리 버튼 등)에서도 쓸 수 있도록 public 서비스 메서드로 둔다.
 * 실제 SAP 호출은 {@link HrInterfaceClient}(현재 Stub)에 위임 — 연동방식 확정 시 그 구현만 교체.
 *
 * <p>안전 원칙:
 * <ul>
 *   <li>ES_RETURN MSGTY!='S' 이면 적재를 중단한다 — 빈/부분 데이터로 기존 데이터를 덮어쓰지 않는다.</li>
 *   <li>upsert는 출처='SAP' 행만 갱신한다(매퍼 MERGE 가드). 출처='SHE' 자체등록 사용자는 보호.</li>
 *   <li>삭제(DELETE)는 하지 않는다 — MERGE는 INSERT/UPDATE만 수행.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HrSyncService {

    /** MSSQL 파라미터 한도(2100) 및 트랜잭션 입도 고려 — 청크 단위(ButtonRule 관례 준용). */
    private static final int CHUNK_SIZE = 400;

    private final HrInterfaceClient hrClient;
    private final HrSyncMapper hrSyncMapper;

    /**
     * 부서 동기화. 부서 트리가 먼저 존재해야 하므로 사용자보다 선행 호출한다.
     */
    @Transactional
    public HrSyncResult syncDepartments(String baseDate, String companyCode) {
        // ① 수신
        HrFetchResult<HrDeptDto> fetched = hrClient.fetchDepartments(baseDate);

        // ② ES_RETURN 성공 확인 — 실패면 적재 중단(덮어쓰기 금지)
        if (!fetched.isSuccess()) {
            return failAndLog("DEPT", fetched.size(),
                    "수신 실패(MSGTY!=S): " + fetched.message());
        }

        // ③ 출처='SAP' 한정 upsert
        int upserted = 0, skipped = 0;
        List<HrDeptDto> items = fetched.getItems();
        for (int from = 0; from < items.size(); from += CHUNK_SIZE) {
            int to = Math.min(from + CHUNK_SIZE, items.size());
            for (HrDeptDto d : items.subList(from, to)) {
                int n = hrSyncMapper.upsertSapDept(d, companyCode);
                if (n > 0) upserted++; else skipped++;   // 0 = 보호스킵('SHE') 또는 무변경
            }
        }

        // ④ 결과 + 이력
        String msg = String.format("부서 동기화 완료 — 수신 %d, upsert %d, 보호/스킵 %d. %s",
                fetched.size(), upserted, skipped, fetched.message());
        return successAndLog("DEPT", fetched.size(), upserted, skipped, msg);
    }

    /**
     * 사용자 동기화. 부서 동기화 이후 호출(부서 트리 선행).
     * @param status 조회 상태 필터(정의서 기준, null이면 전체)
     */
    @Transactional
    public HrSyncResult syncEmployees(String baseDate, String status, String companyCode) {
        // ① 수신
        HrFetchResult<HrUserDto> fetched = hrClient.fetchUsers(baseDate, status);

        // ② ES_RETURN 성공 확인 — 실패면 적재 중단(덮어쓰기 금지)
        if (!fetched.isSuccess()) {
            return failAndLog("USER", fetched.size(),
                    "수신 실패(MSGTY!=S): " + fetched.message());
        }

        // ③ 출처='SAP' 한정 upsert
        int upserted = 0, skipped = 0;
        List<HrUserDto> items = fetched.getItems();
        for (int from = 0; from < items.size(); from += CHUNK_SIZE) {
            int to = Math.min(from + CHUNK_SIZE, items.size());
            for (HrUserDto u : items.subList(from, to)) {
                String mappedStatus = convertUserStatus(u.getStatus());
                int n = hrSyncMapper.upsertSapUser(u, mappedStatus, companyCode);
                if (n > 0) upserted++; else skipped++;   // 0 = 보호스킵('SHE') 또는 무변경
            }
        }

        // ④ 결과 + 이력
        String msg = String.format("사용자 동기화 완료 — 수신 %d, upsert %d, 보호/스킵 %d. %s",
                fetched.size(), upserted, skipped, fetched.message());
        return successAndLog("USER", fetched.size(), upserted, skipped, msg);
    }

    /**
     * SAP STATUS → SHE UserStatus('10' 정상 / '20' 비활성) 변환.
     *
     * <p>TODO(예스코 회신 대기): SAP STATUS 코드값 ↔ SHE 상태 매핑표 확정 필요.
     * 임의 값 매핑 금지 — 확정 전까지 원시값을 그대로 패스스루한다.
     * (원시값이 '10'이 아니면 조회 필터(UserStatus='10')에서 자연히 제외되어
     *  잘못 '활성'으로 노출되는 사고를 방지. 적재 활성화 전 반드시 본 매핑을 구현할 것.)
     */
    static String convertUserStatus(String sapStatus) {
        // TODO: 예스코 제공 STATUS 코드표에 따라 매핑 구현 (예: "3"/"활성" → "10", "퇴직" → "20")
        return sapStatus;
    }

    private HrSyncResult successAndLog(String target, int received, int upserted, int skipped, String message) {
        log.info("[HR-SYNC] {}", message);
        writeLog(target, received, true, message);
        return HrSyncResult.builder()
                .target(target).success(true)
                .received(received).upserted(upserted).skipped(skipped)
                .message(message).build();
    }

    private HrSyncResult failAndLog(String target, int received, String message) {
        log.warn("[HR-SYNC] {} 동기화 중단 — {}", target, message);
        writeLog(target, received, false, message);
        return HrSyncResult.builder()
                .target(target).success(false)
                .received(received).upserted(0).skipped(0)
                .message(message).build();
    }

    private void writeLog(String target, int received, boolean success, String message) {
        try {
            hrSyncMapper.insertSyncLog(HrSyncLog.builder()
                    .target(target).receivedCount(received).success(success)
                    .message(truncate(message, 2000)).build());
        } catch (Exception e) {
            log.warn("[HR-SYNC] 이력 적재 실패(target={})", target, e);
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
