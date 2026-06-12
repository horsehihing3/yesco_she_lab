package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_button_rule 의 "명백히 잘못된 레거시 행" 제거 (멱등).
 * 과거 광범위 시드로 들어간 over-grant 를 모델에 맞게 정리한다.
 * - fresh DB: 해당 행이 없어 no-op
 * - 기존 DB(레거시 보유): over-grant 제거
 * 시더(102/103) 이후 실행(@Order 104). 시더는 올바른 행만 추가하므로 충돌 없음.
 *
 * 보존(제거 안 함): 셀프서비스 '신청 등록', 댓글/답글, 조회류 → guest 유지.
 */
@Slf4j
@Order(104)
@Component
@RequiredArgsConstructor
public class ButtonRuleCleanupInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final String[] CLEANUP_SQL = {
        // New 버튼 = 일반관리자+슈퍼만 (writer/guest/TEAM_ADMIN/승인자/감사원 제거 — New 시점엔 레코드 없음)
        "UPDATE tb_button_rule SET visible=0 WHERE button_name IN (N'New', N'신규 등록') " +
        "  AND role_key IN ('writer','guest','TEAM_ADMIN','planApprover','completionApprover','auditor') AND visible=1",
        // 승인/반려/완료/수료/지급완료/반납 = 승인자·일반관리자·슈퍼만 (guest/writer 제거)
        "UPDATE tb_button_rule SET visible=0 WHERE button_name IN " +
        "  (N'승인',N'반려',N'계획 결재 승인',N'계획 결재 반려',N'완료 결재 승인',N'완료 결재 반려',N'완료 승인',N'반려 (완료)',N'수료',N'지급완료',N'반납') " +
        "  AND role_key IN ('guest','writer') AND visible=1",
        // 상신/저장/수정/삭제/취소 = 작성자·점검자·슈퍼 (일반사용자 guest 제거; 셀프서비스 '신청 등록'은 대상 아님)
        "UPDATE tb_button_rule SET visible=0 WHERE button_name IN " +
        "  (N'계획 결재 상신',N'완료 결재 상신',N'저장',N'저장 (체크리스트)',N'저장 (실시 내용)',N'저장 (KPI 값)',N'저장 (감사 정보)',N'수정',N'삭제',N'취소',N'신청 취소') " +
        "  AND role_key='guest' AND visible=1",
    };

    @Override
    public void run(String... args) {
        try {
            int n = 0;
            for (String sql : CLEANUP_SQL) n += jdbcTemplate.update(sql);
            log.info("ButtonRuleCleanupInitializer: {}건 정리(over-grant 제거)", n);
        } catch (Exception e) {
            log.warn("ButtonRuleCleanupInitializer 실패: {}", e.getMessage());
        }
    }
}
