package com.smartehs.mapper;

import com.smartehs.model.EhsAnnualPlanGoal;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsAnnualPlanGoalMapper {
    List<EhsAnnualPlanGoal> findByPlanId(@Param("planId") Long planId);
    void insert(EhsAnnualPlanGoal goal);
    void deleteByPlanId(@Param("planId") Long planId);
}
