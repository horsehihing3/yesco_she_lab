package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentLogMapper {
    void insert(RiskAssessmentLog log);
    List<RiskAssessmentLog> findByAssessmentId(@Param("assessmentId") Long assessmentId);
}
