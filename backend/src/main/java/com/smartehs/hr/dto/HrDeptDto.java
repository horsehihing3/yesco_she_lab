package com.smartehs.hr.dto;

import lombok.Data;

/**
 * SAP HR 부서정보 IF 수신 DTO.
 * 정의서 수신 필드 중 SHE 사용 항목만(미사용 필드 제외).
 *
 * <p>매핑 (SAP 필드 → T_IDM_GROUP 컬럼):
 * <ul>
 *   <li>CO_ID       → CompanyCode</li>
 *   <li>DEPT_ID     → GroupCode (비즈니스 키, upsert 기준)</li>
 *   <li>DEPT_NAME   → GroupName</li>
 *   <li>PARENT_CODE → UpperGroupCode (트리 계층 — 실사용)</li>
 * </ul>
 */
@Data
public class HrDeptDto {

    /** CO_ID — 회사코드 */
    private String coId;

    /** DEPT_ID — 부서코드 (비즈니스 키) */
    private String deptId;

    /** DEPT_NAME — 부서명 */
    private String deptName;

    /** PARENT_CODE — 상위부서코드 */
    private String parentCode;
}
