package com.smartehs.mapper;

import com.smartehs.model.PpePerformance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpePerformanceMapper {
    List<PpePerformance> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpePerformance> findByResult(@Param("result") String result, @Param("offset") int offset, @Param("limit") int limit);
    int countByResult(@Param("result") String result);
    List<PpePerformance> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpePerformance findById(@Param("id") Long id);
    void insert(PpePerformance perf);
    void update(PpePerformance perf);
    void softDelete(@Param("id") Long id);
    int countOk();
    int countFail();
    int countPending();
}
