package com.smartehs.mapper;

import com.smartehs.model.FirePlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FirePlanMapper {
    List<FirePlan> findAll();
    FirePlan findById(@Param("id") Long id);
    int countAll();
    void insert(FirePlan e);
    void update(FirePlan e);
    void softDelete(@Param("id") Long id);
}
