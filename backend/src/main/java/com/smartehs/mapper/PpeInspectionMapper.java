package com.smartehs.mapper;

import com.smartehs.model.PpeInspection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeInspectionMapper {
    List<PpeInspection> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeInspection> findByType(@Param("type") String type, @Param("offset") int offset, @Param("limit") int limit);
    int countByType(@Param("type") String type);
    List<PpeInspection> findByResult(@Param("result") String result, @Param("offset") int offset, @Param("limit") int limit);
    int countByResult(@Param("result") String result);
    List<PpeInspection> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpeInspection findById(@Param("id") Long id);
    List<PpeInspection> findUpcoming(@Param("days") int days);
    List<PpeInspection> findFails();
    void insert(PpeInspection inspection);
    void update(PpeInspection inspection);
    void softDelete(@Param("id") Long id);
    int countPass();
    int countFailOrDispose();
    int countUpcoming(@Param("days") int days);
}
