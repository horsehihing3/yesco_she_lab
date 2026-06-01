package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentDetailForm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentDetailFormMapper {

    List<RiskAssessmentDetailForm> findAll();

    RiskAssessmentDetailForm findById(@Param("id") Long id);

    List<RiskAssessmentDetailForm> findByRiskId(@Param("riskId") String riskId);

    List<RiskAssessmentDetailForm> findByRiskIdOrderBySortNoAsc(@Param("riskId") String riskId);

    void insert(RiskAssessmentDetailForm form);

    void update(RiskAssessmentDetailForm form);

    void delete(@Param("id") Long id);

    void deleteByRiskId(@Param("riskId") String riskId);
}
