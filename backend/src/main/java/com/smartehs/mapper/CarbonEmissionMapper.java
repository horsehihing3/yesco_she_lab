package com.smartehs.mapper;

import com.smartehs.model.CarbonEmission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CarbonEmissionMapper {

    List<CarbonEmission> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    CarbonEmission findById(@Param("id") Long id);

    List<CarbonEmission> findBySourceNameContaining(@Param("sourceName") String sourceName, @Param("offset") int offset, @Param("limit") int limit);

    int countBySourceNameContaining(@Param("sourceName") String sourceName);

    List<CarbonEmission> findByScope(@Param("scope") int scope, @Param("offset") int offset, @Param("limit") int limit);

    int countByScope(@Param("scope") int scope);

    List<CarbonEmission> findAllList();

    Map<String, Object> getDashboardStats();

    void insert(CarbonEmission carbonEmission);

    void update(CarbonEmission carbonEmission);

    void delete(@Param("id") Long id);
}
