package com.smartehs.mapper;

import com.smartehs.model.HealthCheckupDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HealthCheckupDetailMapper {

    List<HealthCheckupDetail> findByCheckupId(@Param("checkupId") String checkupId);
    HealthCheckupDetail findById(@Param("id") Long id);

    void insert(HealthCheckupDetail detail);
    void deleteByCheckupId(@Param("checkupId") String checkupId);
}
