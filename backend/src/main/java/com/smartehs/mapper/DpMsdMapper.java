package com.smartehs.mapper;

import com.smartehs.model.DpMsd;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpMsdMapper {
    List<DpMsd> findAll();
    DpMsd findById(@Param("id") Long id);
    int countAll();
    int countByRiskLevel(@Param("riskLevel") String riskLevel);
    void insert(DpMsd e);
    void update(DpMsd e);
    void softDelete(@Param("id") Long id);
}
