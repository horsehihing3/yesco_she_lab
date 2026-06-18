package com.smartehs.hr.dto;

import lombok.Data;

/**
 * SAP HR 사용자정보 IF 수신 DTO.
 * 인터페이스 정의서의 수신 필드 중 SHE가 실제 사용하는 항목만 정의(미사용 필드 제외).
 *
 * <p>매핑 (SAP 필드 → T_IDM_USER 컬럼):
 * <ul>
 *   <li>EMP_ID    → EmpNo (비즈니스 키, upsert 기준) + UID(로그인ID=사번)</li>
 *   <li>EMP_NAME  → UserName</li>
 *   <li>DEPT_ID   → DeptCode</li>
 *   <li>TITLE_CODE→ TitleCode (직위코드)</li>
 *   <li>TITLE_NAME→ TitleName (직위명 — 방안A로 직접 적재. 조회는 TitleName 우선·HRCODE 폴백)</li>
 *   <li>직책코드   → DutyCode (적재만)</li>
 *   <li>직책명     → DutyName (적재만 — 화면/조인 없음)</li>
 *   <li>USER_TYPE → ObjectCategory (적재만 — 활용은 추후 결정)</li>
 *   <li>STATUS    → UserStatus (변환 필요 — {@code HrSyncService.convertUserStatus})</li>
 *   <li>CELLNO    → Mobile</li>
 *   <li>EMAIL     → Email</li>
 * </ul>
 */
@Data
public class HrUserDto {

    /** EMP_ID — 사번 (비즈니스 키) */
    private String empId;

    /** EMP_NAME — 한글 이름 */
    private String empName;

    /** DEPT_ID — 부서코드 */
    private String deptId;

    /** TITLE_CODE — 직위코드 */
    private String titleCode;

    /** TITLE_NAME — 직위명 → TitleName 적재(방안A). 조회는 TitleName 우선·HRCODE 폴백 */
    private String titleName;

    /** 직책코드 → DutyCode 적재(기존 컬럼 활용, 화면 미사용) */
    private String dutyCode;

    /** 직책명 → DutyName 적재(신규 컬럼, 화면/조인 없음 — 적재만) */
    private String dutyName;

    /** USER_TYPE — 사용자구분 → ObjectCategory 적재(활용은 추후) */
    private String userType;

    /** STATUS — SAP 원시 상태값 (SHE '10'/'20' 변환 전) */
    private String status;

    /** CELLNO — 핸드폰 */
    private String cellNo;

    /** EMAIL — 이메일 */
    private String email;
}
