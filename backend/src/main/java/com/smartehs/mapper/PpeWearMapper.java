package com.smartehs.mapper;

import com.smartehs.model.PpeWear;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PpeWearMapper {
    List<PpeWear> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeWear> findByDepartment(@Param("department") String dept, @Param("offset") int offset, @Param("limit") int limit);
    int countByDepartment(@Param("department") String dept);
    List<PpeWear> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    List<PpeWear> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpeWear findById(@Param("id") Long id);
    void insert(PpeWear wear);
    void update(PpeWear wear);
    void softDelete(@Param("id") Long id);
    int countOk();
    int countViolation();
    int countNonCompliant();
    List<Map<String, Object>> rateByDepartment();
}
