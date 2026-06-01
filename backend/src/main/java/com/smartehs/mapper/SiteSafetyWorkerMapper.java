package com.smartehs.mapper;

import com.smartehs.model.SiteSafetyWorker;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface SiteSafetyWorkerMapper {
    List<SiteSafetyWorker> findByPlanId(@Param("planId") Long planId);
    void insert(SiteSafetyWorker worker);
    void deleteByPlanId(@Param("planId") Long planId);
}
