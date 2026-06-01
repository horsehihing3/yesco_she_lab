package com.smartehs.mapper;

import com.smartehs.model.OdExposure;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdExposureMapper {
    List<OdExposure> findAll();
    OdExposure findById(@Param("id") Long id);
    int countByStatus(@Param("status") String status);
    void insert(OdExposure e);
    void update(OdExposure e);
    void softDelete(@Param("id") Long id);
}
