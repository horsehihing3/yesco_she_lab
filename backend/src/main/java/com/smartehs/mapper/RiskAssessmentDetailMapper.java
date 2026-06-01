package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentDetailMapper {

    List<RiskAssessmentDetail> findByRiskId(@Param("riskId") String riskId);

    List<RiskAssessmentDetail> findByRiskIdAndMajorCategory(@Param("riskId") String riskId, @Param("majorCategory") String majorCategory);

    List<RiskAssessmentDetail> findByRiskIdAndMinScore(@Param("riskId") String riskId, @Param("minScore") Integer minScore);

    List<RiskAssessmentDetail> findByRiskIdAndIsRegistered(@Param("riskId") String riskId);

    RiskAssessmentDetail findById(@Param("id") Long id);

    void insert(RiskAssessmentDetail detail);

    void update(RiskAssessmentDetail detail);

    void delete(@Param("id") Long id);

    void deleteByRiskId(@Param("riskId") String riskId);
}
