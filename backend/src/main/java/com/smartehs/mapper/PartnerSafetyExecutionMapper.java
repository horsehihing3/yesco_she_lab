package com.smartehs.mapper;

import com.smartehs.model.PartnerSafetyExecution;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PartnerSafetyExecutionMapper {
    void insert(PartnerSafetyExecution e);
    void update(PartnerSafetyExecution e);
    PartnerSafetyExecution findById(@Param("id") Long id);
    PartnerSafetyExecution findByToken(@Param("token") String token);
    List<PartnerSafetyExecution> findCompleted();
    List<PartnerSafetyExecution> findByPlanId(@Param("planId") Long planId);
    List<PartnerSafetyExecution> findAll();
    void deleteById(@Param("id") Long id);
}
