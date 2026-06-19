package com.smartehs.mapper;

import com.smartehs.model.PpeBudget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeBudgetMapper {
    List<PpeBudget> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeBudget> findByYear(@Param("year") Integer year);
    List<PpeBudget> findByDepartment(@Param("department") String department);
    PpeBudget findById(@Param("id") Long id);
    void insert(PpeBudget budget);
    void update(PpeBudget budget);
    void softDelete(@Param("id") Long id);
    Long sumBudget(@Param("year") Integer year);
    Long sumSpent(@Param("year") Integer year);
}
