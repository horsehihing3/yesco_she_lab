package com.smartehs.mapper;

import com.smartehs.model.EhsBudgetPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsBudgetPlanMapper {
    List<EhsBudgetPlan> findAll(@Param("budgetYear") Integer budgetYear,
                                @Param("offset") int offset,
                                @Param("limit") int limit);
    int countByYear(@Param("budgetYear") Integer budgetYear);
    EhsBudgetPlan findById(@Param("id") Long id);
    List<EhsBudgetPlan> findByYearAndCategory(@Param("budgetYear") Integer budgetYear,
                                              @Param("category") String category);
    List<EhsBudgetPlan> findByYear(@Param("budgetYear") Integer budgetYear);
    void insert(EhsBudgetPlan plan);
    void update(EhsBudgetPlan plan);
    void delete(@Param("id") Long id);
}
