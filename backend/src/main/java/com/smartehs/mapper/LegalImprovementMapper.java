package com.smartehs.mapper;

import com.smartehs.model.LegalImprovement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalImprovementMapper {
    List<LegalImprovement> findAll();
    LegalImprovement findById(@Param("id") Long id);
    int countAll();
    int countByColStatus(@Param("status") String status);
    void insert(LegalImprovement entity);
    void update(LegalImprovement entity);
    void softDelete(@Param("id") Long id);
}
