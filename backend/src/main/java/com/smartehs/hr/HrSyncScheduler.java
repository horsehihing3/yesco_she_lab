package com.smartehs.hr;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * HR 일배치 동기화 스케줄러 (얇은 래퍼). 실제 로직은 {@link HrSyncService}.
 *
 * <p>{@code @EnableScheduling} 은 {@code SmartEhsApplication} 에 이미 활성화됨.
 * 적재는 SAP 실데이터 + 예스코 DB 이관 이후에만 수행하므로, {@code HR_SYNC_ENABLED=true}
 * 일 때만 동작한다(기본 false — 스키마 추가는 안전하나 실제 적재는 차단).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HrSyncScheduler {

    private static final DateTimeFormatter BASE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final HrSyncService hrSyncService;

    @Value("${hr-sync.enabled:false}")
    private boolean enabled;

    @Value("${hr-sync.company-code:0100004}")
    private String companyCode;

    /** 조회 상태 필터(정의서 기준). 미지정 시 전체. TODO(예스코): 필요한 상태값 확정. */
    @Value("${hr-sync.user-status:}")
    private String userStatus;

    /**
     * 일 1회 배치 — 부서 → 사용자 순서(부서 트리 선행).
     * cron 시각은 설정값으로 외부화(SAP 확정 시각 이후로 조정 가능).
     */
    @Scheduled(cron = "${hr-sync.cron:0 0 4 * * *}", zone = "Asia/Seoul")
    public void dailyHrSync() {
        if (!enabled) {
            log.info("[HR-SYNC] HR_SYNC_ENABLED=false — 일배치 스킵(적재 차단). 스키마 추가만 적용된 상태.");
            return;
        }
        String baseDate = LocalDate.now(SEOUL).format(BASE_DATE);
        String status = (userStatus == null || userStatus.isBlank()) ? null : userStatus;
        log.info("[HR-SYNC] 일배치 시작 — baseDate={}, companyCode={}", baseDate, companyCode);

        // 부서 트리가 먼저 있어야 사용자 부서 매핑이 성립 → 부서 선행
        hrSyncService.syncDepartments(baseDate, companyCode);
        hrSyncService.syncEmployees(baseDate, status, companyCode);

        log.info("[HR-SYNC] 일배치 종료 — baseDate={}", baseDate);
    }
}
