package com.smartehs.mapper;

import com.smartehs.model.HealthCheckupPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HealthCheckupPlanMapper {
    List<HealthCheckupPlan> findAllWithPaging(
            @Param("checkupType") String checkupType,
            @Param("planYear") Integer planYear,
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("limit") int limit);

    int countAll(@Param("checkupType") String checkupType,
                 @Param("planYear") Integer planYear,
                 @Param("status") String status);

    HealthCheckupPlan findById(@Param("id") Long id);

    void insert(HealthCheckupPlan plan);
    void update(HealthCheckupPlan plan);
    void delete(@Param("id") Long id);

    void transition(@Param("id") Long id,
                    @Param("status") String status,
                    @Param("approved") boolean approved,
                    @Param("approvedBy") String approvedBy,
                    @Param("stage") String stage,
                    @Param("rejectReason") String rejectReason);
}
