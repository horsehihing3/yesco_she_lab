package com.smartehs.mapper;

import com.smartehs.model.OdPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdPlanMapper {
    List<OdPlan> findAll();
    OdPlan findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    void insert(OdPlan e);
    void update(OdPlan e);
    void softDelete(@Param("id") Long id);
}
