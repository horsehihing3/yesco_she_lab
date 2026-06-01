package com.smartehs.mapper;

import com.smartehs.model.EhsKpiPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsKpiPlanMapper {

    List<EhsKpiPlan> findAll(@Param("offset") int offset, @Param("limit") int limit);

    int count();

    EhsKpiPlan findById(@Param("id") Long id);

    List<EhsKpiPlan> search(@Param("keyword") String keyword, @Param("indicatorType") String indicatorType,
                            @Param("offset") int offset, @Param("limit") int limit);

    int countSearch(@Param("keyword") String keyword, @Param("indicatorType") String indicatorType);

    void insert(EhsKpiPlan ehsKpiPlan);

    void update(EhsKpiPlan ehsKpiPlan);

    void softDelete(@Param("id") Long id);
}
