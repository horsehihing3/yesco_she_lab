package com.smartehs.mapper;

import com.smartehs.model.HealthCheckupRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HealthCheckupRecordMapper {
    List<HealthCheckupRecord> findAll();
    List<HealthCheckupRecord> findByName(@Param("name") String name);
    HealthCheckupRecord findById(@Param("id") Long id);
    void insert(HealthCheckupRecord record);
    int update(HealthCheckupRecord record);
    int delete(@Param("id") Long id);
}
