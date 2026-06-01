package com.smartehs.mapper;

import com.smartehs.model.DpStress;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpStressMapper {
    List<DpStress> findAll();
    DpStress findById(@Param("id") Long id);
    int countAll();
    int countByRiskLevel(@Param("riskLevel") String riskLevel);
    void insert(DpStress e);
    void update(DpStress e);
    void softDelete(@Param("id") Long id);
}
