package com.smartehs.mapper;

import com.smartehs.model.RiskActivityProcess;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskActivityProcessMapper {

    List<RiskActivityProcess> findByRiskId(@Param("riskId") String riskId);

    List<RiskActivityProcess> findByRiskIdAndMajorCategoryIdx(@Param("riskId") String riskId, @Param("majorCategoryIdx") Integer majorCategoryIdx);

    List<RiskActivityProcess> findByRiskIdAndIsTarget(@Param("riskId") String riskId);

    RiskActivityProcess findById(@Param("id") Long id);

    int countByRiskIdAndMajorCategoryIdx(@Param("riskId") String riskId, @Param("majorCategoryIdx") Integer majorCategoryIdx);

    void insert(RiskActivityProcess process);

    void update(RiskActivityProcess process);

    void delete(@Param("id") Long id);

    void deleteByRiskId(@Param("riskId") String riskId);
}
