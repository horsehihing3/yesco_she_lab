package com.smartehs.mapper;

import com.smartehs.model.EhsPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface EhsPlanMapper {

    List<EhsPlan> findAll();

    List<EhsPlan> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    EhsPlan findById(@Param("id") Long id);

    List<EhsPlan> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContaining(@Param("title") String title);

    List<EhsPlan> findByPlanCategory(@Param("planCategory") String planCategory, @Param("offset") int offset, @Param("limit") int limit);

    int countByPlanCategory(@Param("planCategory") String planCategory);

    List<EhsPlan> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<EhsPlan> findOverlappingPlans(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    void insert(EhsPlan ehsPlan);

    void update(EhsPlan ehsPlan);

    void delete(@Param("id") Long id);
}
