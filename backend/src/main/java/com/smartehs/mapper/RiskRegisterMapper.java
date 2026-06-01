package com.smartehs.mapper;

import com.smartehs.model.RiskRegister;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskRegisterMapper {

    List<RiskRegister> findByRiskId(@Param("riskId") String riskId);

    List<RiskRegister> findByRiskIdAndRiskGrade(@Param("riskId") String riskId, @Param("riskGrade") String riskGrade);

    RiskRegister findById(@Param("id") Long id);

    int countByRiskId(@Param("riskId") String riskId);

    void insert(RiskRegister register);

    void update(RiskRegister register);

    void delete(@Param("id") Long id);

    void deleteByRiskId(@Param("riskId") String riskId);
}
