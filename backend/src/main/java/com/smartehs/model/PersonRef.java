package com.smartehs.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사람 참조 값 객체 — 작성자/수정자/계획승인자/완료승인자 공통.
 * DB에는 컬럼 1개에 JSON 으로 저장(PersonRefTypeHandler), 화면 표시는 팀 / 성명 직위.
 * userId = 원본(현재 사용자 상태 추적용), 나머지 = 액션 당시 스냅샷.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonRef {
    private Long userId;
    private String name;      // 성명
    private String team;      // 팀명
    private String position;  // 직위 (부장/과장 등)
    private String title;     // 직책 (팀장 등) — 필요한 메뉴만 사용

    @JsonIgnore
    public boolean isEmpty() {
        return userId == null && name == null && team == null && position == null;
    }

    /** 직책(title) 없이 생성 */
    public static PersonRef of(Long userId, String name, String team, String position) {
        return new PersonRef(userId, name, team, position, null);
    }

    // ── Response DTO flat 매핑용 null-safe 접근자 (모든 테이블 공통) ──
    public static Long   userId(PersonRef p)   { return p != null ? p.getUserId() : null; }
    public static String name(PersonRef p)     { return p != null ? p.getName() : null; }
    public static String team(PersonRef p)     { return p != null ? p.getTeam() : null; }
    public static String position(PersonRef p) { return p != null ? p.getPosition() : null; }
}
