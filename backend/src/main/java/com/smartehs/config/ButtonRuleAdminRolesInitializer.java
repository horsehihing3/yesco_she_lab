package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 도메인별 concrete admin role → tb_button_rule 기본값 설정
 * 서버 시작 시 MERGE(upsert)로 멱등 실행된다.
 * 순서: 101 (MenuPathMigration) 이후 실행
 */
@Slf4j
@Order(102)
@Component
@RequiredArgsConstructor
public class ButtonRuleAdminRolesInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final String MERGE_SQL =
        "MERGE tb_button_rule AS t " +
        "USING (VALUES (?,?,?,?)) AS s(m,st,bn,rk) " +
        "  ON t.menu_path=s.m AND t.status_code=s.st AND t.button_name=s.bn AND t.role_key=s.rk " +
        "WHEN MATCHED THEN UPDATE SET visible=1, modified_at=GETDATE() " +
        "WHEN NOT MATCHED THEN INSERT (menu_path,status_code,button_name,role_key,visible) " +
        "  VALUES (s.m,s.st,s.bn,s.rk,1);";

    @Override
    public void run(String... args) {
        try {
            int count = 0;
            count += initRiskAssessAdmin();
            count += initPpeAdmin();
            count += initHealthAdmin();
            count += initWorkEnvAdmin();
            count += initEhsAdmin();
            count += initWasteAdmin();
            count += initAirWaterAdmin();
            count += initChemAdmin();
            count += initComplianceAdmin();
            log.info("ButtonRuleAdminRolesInitializer: {}건 upsert 완료", count);
        } catch (Exception e) {
            log.warn("ButtonRuleAdminRolesInitializer 실패: {}", e.getMessage());
        }
    }

    /**
     * 해당 역할에 활성 계정이 존재하면 그 역할을 반환, 없으면 EHS_ADMIN 반환.
     * 도메인별 관리자가 아직 지정되지 않은 경우 EHS_ADMIN이 담당한다.
     */
    private String resolveRole(String specificRole) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM T_IDM_USER WHERE UserRole = ? AND UserStatus = '10'",
                Integer.class, specificRole);
            return (count != null && count > 0) ? specificRole : "EHS_ADMIN";
        } catch (Exception e) {
            return "EHS_ADMIN";
        }
    }

    private void u(List<Object[]> rows, String menuPath, String statusCode, String buttonName, String roleKey) {
        rows.add(new Object[]{menuPath, statusCode, buttonName, roleKey});
    }

    private int flush(List<Object[]> rows) {
        int n = 0;
        for (Object[] r : rows) {
            jdbcTemplate.update(MERGE_SQL, r[0], r[1], r[2], r[3]);
            n++;
        }
        rows.clear();
        return n;
    }

    // ── 위험성평가 ─── RISK_ASSESS_ADMIN (없으면 EHS_ADMIN) ──────────────────
    private int initRiskAssessAdmin() {
        final String M = "안전 관리 › 위험성 평가";
        final String R = resolveRole("RISK_ASSESS_ADMIN");
        List<Object[]> rows = new ArrayList<>();
        u(rows, M, "LIST",                 "New",            R);
        u(rows, M, "DETAIL",               "수정",           R);
        u(rows, M, "DETAIL",               "삭제",           R);
        u(rows, M, "draft",                "계획 결재 상신", R);
        u(rows, M, "draft",                "수정",           R);
        u(rows, M, "draft",                "삭제",           R);
        u(rows, M, "submitted",            "반려",           R);
        u(rows, M, "submitted",            "계획 결재 승인", R);
        u(rows, M, "rejected",             "계획 결재 상신", R);
        u(rows, M, "rejected",             "수정",           R);
        u(rows, M, "rejected",             "삭제",           R);
        u(rows, M, "approved",             "저장 (실시 내용)", R);
        u(rows, M, "approved",             "완료 결재 상신", R);
        u(rows, M, "completion_submitted", "반려 (완료)",    R);
        u(rows, M, "completion_submitted", "완료 결재 승인", R);
        return flush(rows);
    }

    // ── 보호구 ─── PPE_ADMIN (없으면 EHS_ADMIN) ──────────────────────────────
    private int initPpeAdmin() {
        final String R = resolveRole("PPE_ADMIN");
        List<Object[]> rows = new ArrayList<>();
        String M1 = "안전 관리 › 보호구 장비 › 재고";
        u(rows, M1, "LIST",      "신규 등록", R);
        u(rows, M1, "DETAIL",    "수정",      R);
        u(rows, M1, "DETAIL",    "삭제",      R);
        String M2 = "안전 관리 › 보호구 장비 › 지급 신청";
        u(rows, M2, "REQUESTED", "수정",     R);
        u(rows, M2, "REQUESTED", "취소",     R);
        u(rows, M2, "REQUESTED", "승인",     R);
        u(rows, M2, "REQUESTED", "반려",     R);
        u(rows, M2, "REQUESTED", "삭제",     R);
        u(rows, M2, "APPROVED",  "지급완료", R);
        u(rows, M2, "ISSUED",    "반납",     R);
        return flush(rows);
    }

    // ── 보건 ─── HEALTH_ADMIN (없으면 EHS_ADMIN) ─────────────────────────────
    private int initHealthAdmin() {
        final String R = resolveRole("HEALTH_ADMIN");
        List<Object[]> rows = new ArrayList<>();

        String HC = "보건 관리 › 건강 검진 관리 › 건강검진 계획";
        u(rows, HC, "LIST",               "신규 등록",       R);
        u(rows, HC, "PLANNED",            "수정",            R);
        u(rows, HC, "PLANNED",            "삭제",            R);
        u(rows, HC, "PLANNED",            "계획 결재 상신",  R);
        u(rows, HC, "REJECTED",           "수정",            R);
        u(rows, HC, "REJECTED",           "삭제",            R);
        u(rows, HC, "REJECTED",           "계획 결재 상신",  R);
        u(rows, HC, "PENDING_APPROVAL",   "반려",            R);
        u(rows, HC, "PENDING_APPROVAL",   "계획 결재 승인",  R);

        String HM = "보건 관리 › 건강 검진 관리 › 검진 관리";
        u(rows, HM, "PENDING_COMPLETION", "완료 승인",       R);

        String HA = "보건 관리 › 건강 검진 관리 › 사후관리";
        u(rows, HA, "LIST",   "PDF 업로드", R);
        u(rows, HA, "DETAIL", "삭제",       R);

        String HI = "보건 관리 › 건강 검진 관리 › 내 검진 이력";
        u(rows, HI, "LIST",   "신규 등록", R);
        u(rows, HI, "DETAIL", "수정",      R);
        u(rows, HI, "DETAIL", "삭제",      R);
        u(rows, HI, "DETAIL", "저장",      R);

        // 직업병관리 6탭
        for (String tab : new String[]{"검진계획","검진현황","검진관리","노출관리","사후관리"}) {
            String OD = "보건 관리 › 직업병 관리 › " + tab;
            u(rows, OD, "LIST",   "New", R);
            u(rows, OD, "DETAIL", "수정", R);
            u(rows, OD, "DETAIL", "삭제", R);
            u(rows, OD, "DETAIL", "저장", R);
        }
        // 사후관리 - 2개의 New 버튼
        String ODA = "보건 관리 › 직업병 관리 › 사후관리";
        u(rows, ODA, "LIST", "New (사후관리 조치)",    R);
        u(rows, ODA, "LIST", "New (업무적합성 평가)", R);

        // 산재신청 (WRITER_ADMIN 기반이지만 관리자도 작성 가능)
        String ODS = "보건 관리 › 직업병 관리 › 산재신청";
        u(rows, ODS, "LIST",  "신규 등록", R);
        u(rows, ODS, "DRAFT", "수정",      R);
        u(rows, ODS, "DRAFT", "제출",      R);
        u(rows, ODS, "DRAFT", "삭제",      R);
        u(rows, ODS, "DRAFT", "저장",      R);

        // 질병예방관리 7탭
        for (String tab : new String[]{"근골격계","뇌심혈관","직무스트레스","호흡기피부","청력보존","온열한랭","감염병"}) {
            String DP = "보건 관리 › 질병예방 관리 › " + tab;
            u(rows, DP, "LIST",   "신규 등록", R);
            u(rows, DP, "DETAIL", "수정",      R);
            u(rows, DP, "DETAIL", "삭제",      R);
            u(rows, DP, "DETAIL", "저장",      R);
        }

        return flush(rows);
    }

    // ── 작업환경측정 ─── WORK_ENV_ADMIN (없으면 EHS_ADMIN) ───────────────────
    private int initWorkEnvAdmin() {
        final String R = resolveRole("WORK_ENV_ADMIN");
        List<Object[]> rows = new ArrayList<>();
        String[][] tabs = {
            {"보건 관리 › 작업환경 측정 › 유해인자",  "LIST",   "신규 등록"},
            {"보건 관리 › 작업환경 측정 › 유해인자",  "DETAIL", "수정"},
            {"보건 관리 › 작업환경 측정 › 유해인자",  "DETAIL", "삭제"},
            {"보건 관리 › 작업환경 측정 › 유해인자",  "DETAIL", "저장"},
            {"보건 관리 › 작업환경 측정 › 측정 계획", "LIST",   "신규 등록"},
            {"보건 관리 › 작업환경 측정 › 측정 계획", "DETAIL", "수정"},
            {"보건 관리 › 작업환경 측정 › 측정 계획", "DETAIL", "삭제"},
            {"보건 관리 › 작업환경 측정 › 측정 계획", "DETAIL", "저장"},
            {"보건 관리 › 작업환경 측정 › 측정 결과", "LIST",   "신규 등록"},
            {"보건 관리 › 작업환경 측정 › 측정 결과", "DETAIL", "수정"},
            {"보건 관리 › 작업환경 측정 › 측정 결과", "DETAIL", "삭제"},
            {"보건 관리 › 작업환경 측정 › 측정 결과", "DETAIL", "저장"},
            {"보건 관리 › 작업환경 측정 › 개선 조치", "LIST",   "신규 등록"},
            {"보건 관리 › 작업환경 측정 › 개선 조치", "DETAIL", "수정"},
            {"보건 관리 › 작업환경 측정 › 개선 조치", "DETAIL", "삭제"},
            {"보건 관리 › 작업환경 측정 › 개선 조치", "DETAIL", "저장"},
        };
        for (String[] t : tabs) u(rows, t[0], t[1], t[2], R);
        return flush(rows);
    }

    // ── 협력업체 ─── EHS_ADMIN ────────────────────────────────────────────────
    private int initEhsAdmin() {
        final String R = "EHS_ADMIN";
        List<Object[]> rows = new ArrayList<>();

        String PSM = "협력 업체 관리 › 협력 업체 안전 관리 › 관리";
        u(rows, PSM, "LIST",               "신규 등록",       R);
        u(rows, PSM, "DRAFT",              "계획 결재 상신",  R);
        u(rows, PSM, "DRAFT",              "수정",            R);
        u(rows, PSM, "DRAFT",              "삭제",            R);
        u(rows, PSM, "PENDING_APPROVAL",   "반려",            R);
        u(rows, PSM, "PENDING_APPROVAL",   "계획 결재 승인",  R);
        u(rows, PSM, "COMPLETION_PENDING", "완료 결재 반려",  R);
        u(rows, PSM, "COMPLETION_PENDING", "완료 결재 승인",  R);

        String PSE = "협력 업체 관리 › 협력 업체 안전 관리 › 실행";
        u(rows, PSE, "APPROVED",           "완료 결재 상신",  R);
        u(rows, PSE, "COMPLETION_PENDING", "완료 결재 반려",  R);
        u(rows, PSE, "COMPLETION_PENDING", "완료 결재 승인",  R);

        String PRA = "협력 업체 관리 › 협력 업체 위험성 평가 › 계획";
        u(rows, PRA, "LIST",               "신규 등록",       R);
        u(rows, PRA, "DRAFT/REJECTED",     "계획 결재 상신",  R);
        u(rows, PRA, "DRAFT/REJECTED",     "수정",            R);
        u(rows, PRA, "DRAFT/REJECTED",     "삭제",            R);
        u(rows, PRA, "PENDING_APPROVAL",   "반려",            R);
        u(rows, PRA, "PENDING_APPROVAL",   "계획 결재 승인",  R);

        String PRS = "협력 업체 관리 › 협력 업체 위험성 평가 › 평가서조회 담당승인자";
        u(rows, PRS, "APPROVED",           "저장",            R);
        u(rows, PRS, "APPROVED",           "완료 결재 상신",  R);
        u(rows, PRS, "COMPLETION_PENDING", "반려",            R);
        u(rows, PRS, "COMPLETION_PENDING", "완료 결재 승인",  R);

        String PRF = "협력 업체 관리 › 협력 업체 위험성 평가 › 전체조회 (어드민)";
        u(rows, PRF, "LIST",               "신규 등록",       R);
        u(rows, PRF, "DRAFT/REJECTED",     "계획 결재 상신",  R);
        u(rows, PRF, "DRAFT/REJECTED",     "수정",            R);
        u(rows, PRF, "DRAFT/REJECTED",     "삭제",            R);
        u(rows, PRF, "PENDING_APPROVAL",   "반려",            R);
        u(rows, PRF, "PENDING_APPROVAL",   "계획 결재 승인",  R);
        u(rows, PRF, "APPROVED",           "저장",            R);
        u(rows, PRF, "APPROVED",           "완료 결재 상신",  R);
        u(rows, PRF, "COMPLETION_PENDING", "반려",            R);
        u(rows, PRF, "COMPLETION_PENDING", "완료 결재 승인",  R);

        String PPW = "협력 업체 관리 › 협력 업체 작업 허가";
        u(rows, PPW, "LIST",                          "신규 등록",        R);
        u(rows, PPW, "DRAFT/REJECTED",                "계획 결재 상신",   R);
        u(rows, PPW, "DRAFT/REJECTED",                "수정",             R);
        u(rows, PPW, "DRAFT/REJECTED",                "삭제",             R);
        u(rows, PPW, "PENDING_APPROVAL/REQUESTED",    "계획 결재 반려",   R);
        u(rows, PPW, "PENDING_APPROVAL/REQUESTED",    "계획 결재 승인",   R);
        u(rows, PPW, "APPROVED",                      "저장 (체크리스트)", R);
        u(rows, PPW, "APPROVED",                      "완료 결재 상신",    R);
        u(rows, PPW, "COMPLETION_PENDING",            "완료 결재 반려",   R);
        u(rows, PPW, "COMPLETION_PENDING",            "완료 결재 승인",   R);

        String PE = "협력 업체 관리 › 협력 업체 평가";
        u(rows, PE, "LIST",     "신규 등록", R);
        u(rows, PE, "완료",     "수정",      R);
        u(rows, PE, "완료",     "삭제",      R);
        u(rows, PE, "예정",     "수정",      R);
        u(rows, PE, "예정",     "삭제",      R);
        u(rows, PE, "재평가",   "수정",      R);
        u(rows, PE, "재평가",   "삭제",      R);

        String OC = "협력 업체 관리 › EHS 협의체";
        u(rows, OC, "LIST",   "New",             R);
        u(rows, OC, "DETAIL", "수정",            R);
        u(rows, OC, "DETAIL", "삭제",            R);
        u(rows, OC, "DETAIL", "참석자 서명 알림", R);

        String CR = "협력 업체 관리 › 협력 업체 등록";
        u(rows, CR, "LIST",   "New (신규 등록)", R);
        u(rows, CR, "DETAIL", "수정",            R);
        u(rows, CR, "DETAIL", "삭제",            R);
        u(rows, CR, "FORM",   "등록 완료 / 저장", R);

        return flush(rows);
    }

    // ── 환경(폐기물) ─── WASTE_ADMIN (없으면 EHS_ADMIN) ─────────────────────
    private int initWasteAdmin() {
        final String R = resolveRole("WASTE_ADMIN");
        List<Object[]> rows = new ArrayList<>();
        String M = "환경 관리 › 폐기물";
        u(rows, M, "LIST",              "신규 등록", R);
        u(rows, M, "STORING",           "수정",      R);
        u(rows, M, "STORING",           "삭제",      R);
        u(rows, M, "DISPOSAL_REQUEST",  "수정",      R);
        u(rows, M, "DISPOSAL_REQUEST",  "삭제",      R);
        u(rows, M, "PROCESSING",        "수정",      R);
        u(rows, M, "PROCESSING",        "삭제",      R);
        return flush(rows);
    }

    // ── 환경(방사선/인허가) ─── AIR_WATER_ADMIN (없으면 EHS_ADMIN) ─────────
    private int initAirWaterAdmin() {
        final String R = resolveRole("AIR_WATER_ADMIN");
        List<Object[]> rows = new ArrayList<>();

        String RD = "환경 관리 › 방사선관리 › 사고·사건";
        u(rows, RD, "LIST",       "신규 등록", R);
        u(rows, RD, "조사중",     "수정",      R);
        u(rows, RD, "조사중",     "삭제",      R);
        u(rows, RD, "재발방지중", "수정",      R);
        u(rows, RD, "재발방지중", "삭제",      R);

        String PI = "환경 관리 › 인허가 관리 › 인허가 식별";
        u(rows, PI, "LIST",   "신규 등록", R);
        u(rows, PI, "검토중", "수정",      R);
        u(rows, PI, "검토중", "삭제",      R);
        u(rows, PI, "미식별", "수정",      R);
        u(rows, PI, "미식별", "삭제",      R);

        String PL = "환경 관리 › 인허가 관리 › 인허가 대장";
        u(rows, PL, "LIST",   "신규 등록", R);
        u(rows, PL, "만료임박", "수정",    R);
        u(rows, PL, "만료임박", "삭제",    R);
        u(rows, PL, "만료",    "수정",     R);
        u(rows, PL, "만료",    "삭제",     R);

        String PC = "환경 관리 › 인허가 관리 › 변경 관리";
        u(rows, PC, "LIST",                          "신규 등록", R);
        u(rows, PC, "검토중/안전영향평가/허가신청/심사중", "수정", R);
        u(rows, PC, "검토중/안전영향평가/허가신청/심사중", "삭제", R);

        String PR = "환경 관리 › 인허가 관리 › 법정 보고서";
        u(rows, PR, "LIST", "신규 등록", R);
        u(rows, PR, "준비중", "수정",    R);
        u(rows, PR, "준비중", "삭제",    R);
        u(rows, PR, "임박",   "수정",    R);
        u(rows, PR, "임박",   "삭제",    R);
        u(rows, PR, "지연",   "수정",    R);
        u(rows, PR, "지연",   "삭제",    R);

        return flush(rows);
    }

    // ── 화학물질 ─── CHEM_ADMIN (없으면 EHS_ADMIN) ───────────────────────────
    private int initChemAdmin() {
        final String R = resolveRole("CHEM_ADMIN");
        List<Object[]> rows = new ArrayList<>();
        String M = "화학물질 관리 › 위해성 보고";
        u(rows, M, "LIST",       "신규 등록", R);
        u(rows, M, "COLLECTING", "수정",      R);
        u(rows, M, "COLLECTING", "삭제",      R);
        return flush(rows);
    }

    // ── 법규준수 ─── COMPLIANCE_ADMIN (없으면 EHS_ADMIN) ────────────────────
    private int initComplianceAdmin() {
        final String R = resolveRole("COMPLIANCE_ADMIN");
        List<Object[]> rows = new ArrayList<>();

        String LC = "EHS 경영 › 법규 대응 › 법규검토시스템";
        u(rows, LC, "LIST",   "신규 등록", R);
        u(rows, LC, "DETAIL", "수정",      R);
        u(rows, LC, "DETAIL", "삭제",      R);

        String LP = "EHS 경영 › 법규 대응 › 법규 대응 계획";
        u(rows, LP, "LIST",               "신규 등록",    R);
        u(rows, LP, "PLAN",               "저장",         R);
        u(rows, LP, "PLAN",               "계획 결재 상신", R);
        u(rows, LP, "PLAN",               "수정",         R);
        u(rows, LP, "PLAN",               "삭제",         R);
        u(rows, LP, "PENDING_APPROVAL",   "반려",         R);
        u(rows, LP, "PENDING_APPROVAL",   "계획 승인",    R);

        String LE = "EHS 경영 › 법규 대응 › 법규 대응 실시";
        u(rows, LE, "PREPARING",     "저장 (감사 정보)",   R);
        u(rows, LE, "PREPARING",     "진행중 (상태 전환)", R);
        u(rows, LE, "IN_PROGRESS",   "저장 (감사 정보)",   R);
        u(rows, LE, "IN_PROGRESS",   "완료 결재 상신",     R);
        u(rows, LE, "PENDING_CLOSE", "저장 (감사 정보)",   R);
        u(rows, LE, "PENDING_CLOSE", "반려",               R);
        u(rows, LE, "PENDING_CLOSE", "완료 승인",          R);

        return flush(rows);
    }
}
