package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentAddInfoForm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentAddInfoFormMapper {

    List<RiskAssessmentAddInfoForm> findAll();

    RiskAssessmentAddInfoForm findById(@Param("id") Long id);

    List<RiskAssessmentAddInfoForm> findByRiskId(@Param("riskId") String riskId);

    void insert(RiskAssessmentAddInfoForm form);

    void update(RiskAssessmentAddInfoForm form);

    void delete(@Param("id") Long id);

    void deleteByRiskId(@Param("riskId") String riskId);
}
