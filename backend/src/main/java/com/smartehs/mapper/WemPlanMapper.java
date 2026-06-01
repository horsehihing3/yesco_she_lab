package com.smartehs.mapper;

import com.smartehs.model.WemPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WemPlanMapper {
    List<WemPlan> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<WemPlan> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    WemPlan findById(@Param("id") Long id);
    void insert(WemPlan plan);
    void update(WemPlan plan);
    void delete(@Param("id") Long id);
}
