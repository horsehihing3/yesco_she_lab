package com.smartehs.mapper;

import com.smartehs.model.WemImprovement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WemImprovementMapper {
    List<WemImprovement> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<WemImprovement> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    List<WemImprovement> findByExceedLevel(@Param("exceedLevel") String exceedLevel, @Param("offset") int offset, @Param("limit") int limit);
    int countByExceedLevel(@Param("exceedLevel") String exceedLevel);
    WemImprovement findById(@Param("id") Long id);
    void insert(WemImprovement improvement);
    void update(WemImprovement improvement);
    void delete(@Param("id") Long id);
}
