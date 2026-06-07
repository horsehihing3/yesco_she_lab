package com.smartehs.mapper;

import com.smartehs.model.PsmData;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PsmDataMapper {
    List<PsmData> findAll(@Param("category") String category, @Param("offset") int offset, @Param("limit") int limit);
    int count(@Param("category") String category);
    PsmData findById(@Param("id") Long id);
    void insert(PsmData d);
    void update(PsmData d);
    void softDelete(@Param("id") Long id);
    /** 만료 임박/초과 항목 (next_inspection_date 기준) */
    List<PsmData> findExpiring();
}
