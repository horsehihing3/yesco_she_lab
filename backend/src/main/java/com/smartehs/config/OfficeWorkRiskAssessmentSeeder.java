package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * 위험성 평가 - 사무업무 탭 전용 더미데이터 시드.
 * Flyway 비활성 환경에서도 V134 와 동일한 데이터를 1회 삽입한다.
 * (이미 동일 title 이 있으면 skip — idempotent)
 *
 * 각 평가마다:
 *  - tb_risk_assessment 1건 (office_count=1)
 *  - tb_risk_activity_process 1건 (major_category_idx=1, '사무업무')
 *  - tb_risk_assessment_detail 3건 (Step 2-1 사무업무 화면에서 보이도록 major_category='사무업무')
 */
@Slf4j
@Order(30)
@Component
@RequiredArgsConstructor
public class OfficeWorkRiskAssessmentSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    /** title, site, status, middle, detailAction */
    private static final List<String[]> SEEDS = List.of(
        new String[]{"PC·문서 업무 위험성평가 (사무업무)",     "구리",   "draft",     "PC 업무",     "장시간 모니터 업무·근골격계 부담"},
        new String[]{"사무실 일반 안전 위험성평가 (사무업무)", "남양주", "submitted", "일반 사무",   "전기 기기·콘센트·정수기 사용"},
        new String[]{"문서고/인쇄실 위험성평가 (사무업무)",   "포천",   "approved",  "문서고 작업", "중량물 박스·종이 베임"},
        new String[]{"회의실·응접실 위험성평가 (사무업무)",   "양평",   "draft",     "회의실 운영", "음향·전기 설비 사용"},
        new String[]{"탕비실·휴게실 위험성평가 (사무업무)",   "가평",   "rejected",  "휴게실 이용", "전기 포트·정수기·미끄럼 위험"},
        new String[]{"방문자 응대 업무 위험성평가 (사무업무)", "구리",   "completed", "방문 응대",   "안내 동선·계단 이동"}
    );

    /** 각 평가에 들어갈 평가 항목들. {risk4M, danger, expectedDisaster, target, currentSafetyMeasures, reductionMeasures, possibility, result, improvedPossibility, improvedResult} */
    private record DetailSeed(
        String risk4M, String danger, String expectedDisaster, String target,
        String currentMeasures, String reductionMeasures,
        int possibility, int result, int improvedPossibility, int improvedResult
    ) {}

    private static final List<List<DetailSeed>> DETAIL_SEEDS = List.of(
        // 1) PC 업무
        List.of(
            new DetailSeed("인간공학적", "장시간 좌식 모니터 업무로 인한 거북목/허리 통증",
                "근골격계 질환", "사무직 직원",
                "1시간마다 스트레칭 휴식 권장, 모니터 받침대 배치",
                "전동 높이 조절 책상·인체공학 의자 단계적 도입", 3, 2, 2, 2),
            new DetailSeed("물리적", "장시간 PC 작업으로 인한 안구 건조·피로",
                "VDT 증후군", "사무직 직원",
                "조명 조도 관리, 모니터 밝기 조정",
                "안구 휴식 알림 SW 설치, 보안경 보급", 3, 1, 2, 1),
            new DetailSeed("전기적", "콘센트 과부하·전선 노후",
                "감전·화재", "사무실 전체",
                "전선 정리, 멀티탭 정기 점검",
                "분기마다 전기 안전점검 주기 단축", 2, 3, 1, 3)
        ),
        // 2) 사무실 일반
        List.of(
            new DetailSeed("전기적", "정수기·전기 포트 누전",
                "감전", "탕비실 이용자",
                "접지 확인, 누전차단기 설치",
                "정수기 6개월 1회 누전 점검 의무화", 2, 3, 1, 3),
            new DetailSeed("물리적", "복사기·문서 세단기 협착",
                "손가락 협착", "문서업무 직원",
                "안전 가드 부착, 사용 교육",
                "세단기 자동정지 센서 모델로 교체", 2, 2, 1, 2),
            new DetailSeed("화학적", "토너·청소용제 흡입",
                "호흡기 자극", "사무실 전체",
                "토너 교체 시 환기, 용제 보관함 분리",
                "친환경 토너로 전환", 2, 2, 1, 2)
        ),
        // 3) 문서고/인쇄실
        List.of(
            new DetailSeed("인간공학적", "중량 박스 인력 운반",
                "허리 부상", "문서고 담당자",
                "2인 1조 운반, 무게 표시",
                "핸드트럭 비치, 박스 분할 포장", 3, 3, 2, 2),
            new DetailSeed("물리적", "종이 베임·문서 낙하",
                "외상", "문서고 담당자",
                "장갑 착용, 정리정돈",
                "수직 보관함 안전바 추가 설치", 3, 1, 2, 1),
            new DetailSeed("화학적", "잉크 토너 분진 흡입",
                "호흡기 질환", "인쇄실 담당",
                "환기 강화, 마스크 착용",
                "국소배기장치 설치 검토", 2, 2, 1, 2)
        ),
        // 4) 회의실/응접실
        List.of(
            new DetailSeed("전기적", "프로젝터·음향장비 누전",
                "감전·화재", "회의 참석자",
                "장비 사용 후 전원 차단, 정기 점검",
                "스마트 멀티탭으로 자동 차단", 2, 3, 1, 3),
            new DetailSeed("물리적", "의자·테이블 모서리 충돌",
                "타박상", "회의 참석자",
                "모서리 가드 부착",
                "둥근 모서리 가구로 단계적 교체", 2, 1, 1, 1),
            new DetailSeed("물리적", "VR/디스플레이 장비 낙하",
                "외상", "회의 참석자",
                "벽걸이 고정, 정기 점검",
                "내진 받침 추가 설치", 1, 2, 1, 2)
        ),
        // 5) 탕비실/휴게실
        List.of(
            new DetailSeed("전기적", "전기 포트·커피머신 과열",
                "화상·화재", "탕비실 이용자",
                "사용 후 전원 차단, 안전 거리 유지",
                "자동전원차단 모델로 교체", 2, 3, 1, 3),
            new DetailSeed("물리적", "물기 바닥 미끄럼",
                "미끄럼 부상", "탕비실 이용자",
                "흡수매트 비치, 청소 주기 단축",
                "미끄럼 방지 타일 시공", 3, 2, 2, 2),
            new DetailSeed("생물학적", "정수기·식기 위생 관리 미흡",
                "식중독", "전 직원",
                "월 1회 정수기 청소, 식기 세척기 사용",
                "위생 점검 체크리스트 도입", 2, 2, 1, 2)
        ),
        // 6) 방문자 응대
        List.of(
            new DetailSeed("물리적", "방문자 안내 중 계단 이동 추락",
                "추락", "안내 직원·방문자",
                "엘리베이터 우선 안내, 미끄럼 방지",
                "계단 난간 보강, 야간 조명 강화", 2, 3, 1, 3),
            new DetailSeed("인간공학적", "장시간 안내 데스크 서서 응대",
                "하지 정맥류·피로", "안내 직원",
                "교대 휴식, 발 받침대",
                "높이 조절 안내데스크 도입", 3, 2, 2, 2),
            new DetailSeed("화학적", "방역 소독제 분무 노출",
                "호흡기 자극", "안내 직원",
                "마스크 착용, 환기",
                "저자극 소독제로 교체", 2, 1, 1, 1)
        )
    );

    @Override
    public void run(String... args) {
        try {
            Integer aTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_risk_assessment'", Integer.class);
            Integer pTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_risk_activity_process'", Integer.class);
            Integer dTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_risk_assessment_detail'", Integer.class);
            if (aTable == null || aTable == 0 || pTable == null || pTable == 0
                || dTable == null || dTable == 0) return;

            for (int i = 0; i < SEEDS.size(); i++) {
                String[] s = SEEDS.get(i);
                String title = s[0], site = s[1], status = s[2], middle = s[3], detailAction = s[4];

                // 평가가 이미 있는지 확인
                String existingRiskId;
                try {
                    existingRiskId = jdbcTemplate.queryForObject(
                        "SELECT TOP 1 risk_id FROM tb_risk_assessment WHERE title = ?",
                        String.class, title);
                } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
                    existingRiskId = null;
                }

                String riskId = existingRiskId;
                if (riskId == null) {
                    riskId = UUID.randomUUID().toString();
                    jdbcTemplate.update(
                        "INSERT INTO tb_risk_assessment " +
                        "  (risk_id, title, site, author_name, author_dept, author_mail, " +
                        "   status, risk_register_count, office_count, field_count, allow_resubmit, created_at, modified_at) " +
                        "VALUES (?,?,?,?,?,?,?,0,1,0,1,GETDATE(),GETDATE())",
                        riskId, title, site, "김윤진", "노경지원팀", "", status);

                    jdbcTemplate.update(
                        "INSERT INTO tb_risk_activity_process " +
                        "  (risk_id, major_category_idx, major_category, detail_action, is_target, created_at) " +
                        "VALUES (?,?,?,?,?,GETDATE())",
                        riskId, 1, "사무업무", detailAction, true);
                    log.info("사무업무 평가 시드: {}", title);
                }

                // 상세 평가 항목이 이미 있으면 건너뜀
                Integer detailExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tb_risk_assessment_detail WHERE risk_id = ?",
                    Integer.class, riskId);
                if (detailExists != null && detailExists > 0) continue;

                List<DetailSeed> details = DETAIL_SEEDS.get(i);
                int idx = 1;
                for (DetailSeed d : details) {
                    int riskScore = d.possibility * d.result;
                    int improvedScore = d.improvedPossibility * d.improvedResult;
                    jdbcTemplate.update(
                        "INSERT INTO tb_risk_assessment_detail " +
                        "  (risk_id, activity_process_id, risk_idx, major_category, detail_action, risk_4m, " +
                        "   danger, expected_disaster, target, current_safety_measures, " +
                        "   possibility_grade, result_grade, risk_score, risk_grade, is_registered, " +
                        "   reduction_measures, improved_possibility_grade, improved_result_grade, " +
                        "   improved_risk_score, improved_risk_grade, created_at) " +
                        "VALUES (?,0,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,GETDATE())",
                        riskId, idx++, "사무업무", detailAction, d.risk4M,
                        d.danger, d.expectedDisaster, d.target, d.currentMeasures,
                        d.possibility, d.result, riskScore, gradeOf(riskScore),
                        d.reductionMeasures, d.improvedPossibility, d.improvedResult,
                        improvedScore, gradeOf(improvedScore));
                }
                log.info("사무업무 평가 항목 시드: {} ({}건)", title, details.size());
            }
        } catch (Exception e) {
            log.warn("사무업무 위험성평가 더미 시드 실패", e);
        }
    }

    private String gradeOf(int score) {
        if (score >= 15) return "VH";
        if (score >= 9)  return "H";
        if (score >= 4)  return "M";
        return "L";
    }
}
