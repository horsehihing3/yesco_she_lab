package com.smartehs.mapper;

import com.smartehs.model.KpiRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface KpiRecordMapper {
    List<KpiRecord> findByYearAndDeletedFalse(@Param("year") int year);
    List<KpiRecord> findByTypeAndYearAndDeletedFalse(@Param("kpiType") String kpiType, @Param("year") int year);
    KpiRecord findByIdAndDeletedFalse(@Param("id") Long id);
    void insert(KpiRecord record);
    void update(KpiRecord record);
    void softDelete(@Param("id") Long id);
}
