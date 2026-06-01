package com.smartehs.mapper;

import com.smartehs.model.EhsBudgetExpense;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsBudgetExpenseMapper {
    List<EhsBudgetExpense> findAll(@Param("budgetYear") Integer budgetYear,
                                   @Param("category") String category,
                                   @Param("offset") int offset,
                                   @Param("limit") int limit);
    int countByYearAndCategory(@Param("budgetYear") Integer budgetYear,
                               @Param("category") String category);
    EhsBudgetExpense findById(@Param("id") Long id);
    List<EhsBudgetExpense> findByYear(@Param("budgetYear") Integer budgetYear);
    List<EhsBudgetExpense> findByYearAndCategory(@Param("budgetYear") Integer budgetYear,
                                                 @Param("category") String category);
    void insert(EhsBudgetExpense expense);
    void update(EhsBudgetExpense expense);
    void delete(@Param("id") Long id);
}
