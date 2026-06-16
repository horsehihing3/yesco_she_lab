package com.smartehs.mapper;

import com.smartehs.model.LegalFilter;
import com.smartehs.model.LegalRegistry;
import com.smartehs.model.LegalRevisionLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalResponseMapper {
    // ===== Registry (등록 법령) =====
    List<LegalRegistry> findAllRegistry(@Param("category") String category, @Param("keyword") String keyword);
    LegalRegistry findRegistryById(Long id);
    LegalRegistry findRegistryByLawId(@Param("lawId") String lawId);
    int insertRegistry(LegalRegistry r);
    int updateRegistry(LegalRegistry r);
    int deleteRegistry(Long id);
    int countRegistry();
    int countRegistryByCategory(@Param("category") String category);

    // ===== Revision Log (개정 추적) =====
    List<LegalRevisionLog> findRevisionLogs(@Param("status") String status, @Param("keyword") String keyword);
    LegalRevisionLog findRevisionLogById(Long id);
    int insertRevisionLog(LegalRevisionLog r);
    int updateRevisionLog(LegalRevisionLog r);
    int deleteRevisionLog(Long id);
    int countRevisionByStatus(@Param("status") String status);
    Integer findRevisionByLawIdAndDate(@Param("lawId") String lawId, @Param("revisionDt") String revisionDt);
    // 등록 법령(law_id 셋) 기준 미완료 개정 카운트
    List<java.util.Map<String, Object>> countOpenRevisionsByLawIds(@Param("lawIds") List<String> lawIds);

    // ===== Filter (법령 화이트리스트) =====
    LegalFilter findFilter();
    int updateFilter(LegalFilter f);
}
