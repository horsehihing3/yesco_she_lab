package com.smartehs.mapper;

import com.smartehs.hr.dto.HrDeptDto;
import com.smartehs.hr.dto.HrUserDto;
import com.smartehs.model.HrSyncLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * HR 동기화 upsert + 이력 적재 매퍼.
 *
 * <p>※ upsert 타깃 = T_IDM_USER / T_IDM_GROUP (IDM 테이블 직접 사용 — 예스코 환경에선
 * SHE가 소유자이므로 직접 쓰기 허용. tb_user/tb_dept 전환은 폐기됨).
 * 출처='SAP' 행만 갱신하고, 출처='SHE'(자체등록) 행은 보호한다.
 */
@Mapper
public interface HrSyncMapper {

    /** 부서 upsert (키: CompanyCode + GroupCode). 영향 행 수 반환(1=처리, 0=보호스킵/무변경). */
    int upsertSapDept(@Param("d") HrDeptDto dept,
                      @Param("companyCode") String companyCode);

    /** 사용자 upsert (키: EmpNo). 영향 행 수 반환(1=처리, 0=보호스킵/무변경). */
    int upsertSapUser(@Param("u") HrUserDto user,
                      @Param("mappedStatus") String mappedStatus,
                      @Param("companyCode") String companyCode);

    /** 동기화 이력 1건 적재. */
    int insertSyncLog(HrSyncLog logRow);
}
