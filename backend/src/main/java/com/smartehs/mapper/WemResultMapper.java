package com.smartehs.mapper;

import com.smartehs.model.WemResult;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WemResultMapper {
    List<WemResult> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<WemResult> findByJudgment(@Param("judgment") String judgment, @Param("offset") int offset, @Param("limit") int limit);
    int countByJudgment(@Param("judgment") String judgment);
    WemResult findById(@Param("id") Long id);
    void insert(WemResult result);
    void update(WemResult result);
    void delete(@Param("id") Long id);
}
