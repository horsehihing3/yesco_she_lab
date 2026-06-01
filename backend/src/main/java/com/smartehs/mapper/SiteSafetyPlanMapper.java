package com.smartehs.mapper;

import com.smartehs.model.SiteSafetyPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface SiteSafetyPlanMapper {

    List<SiteSafetyPlan> findByDeletedFalse(@Param("planType") String planType, @Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse(@Param("planType") String planType);
    SiteSafetyPlan findById(@Param("id") Long id);
    List<SiteSafetyPlan> findByStatus(@Param("planType") String planType, @Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("planType") String planType, @Param("status") String status);

    void insert(SiteSafetyPlan plan);
    void update(SiteSafetyPlan plan);
    void softDelete(@Param("id") Long id);
    int countByPlanIdStartingWith(@Param("prefix") String prefix);

    void transition(@Param("id") Long id,
                    @Param("status") String status,
                    @Param("approved") boolean approved,
                    @Param("approvedBy") String approvedBy,
                    @Param("stage") String stage,
                    @Param("rejectReason") String rejectReason);

    void acquireEditLock(@Param("id") Long id, @Param("userId") Long userId, @Param("userName") String userName);
    void releaseEditLock(@Param("id") Long id, @Param("userId") Long userId);
}
