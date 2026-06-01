package com.smartehs.mapper;

import com.smartehs.model.ContractorWorker;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ContractorWorkerMapper {

    void insert(ContractorWorker worker);

    List<ContractorWorker> findByPlanId(@Param("planId") Long planId);

    void deleteByPlanId(@Param("planId") Long planId);
}
