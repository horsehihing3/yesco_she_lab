package com.smartehs.mapper;

import com.smartehs.model.EhsAnnualPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsAnnualPlanMapper {
    List<EhsAnnualPlan> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<EhsAnnualPlan> findByYear(@Param("planYear") int planYear, @Param("offset") int offset, @Param("limit") int limit);
    int countByYear(@Param("planYear") int planYear);
    EhsAnnualPlan findById(@Param("id") Long id);
    void insert(EhsAnnualPlan plan);
    void update(EhsAnnualPlan plan);
    void delete(@Param("id") Long id);
    List<EhsAnnualPlan> findApprovedByYear(@Param("planYear") int planYear);
    int transition(@Param("id") Long id, @Param("status") String status,
                   @Param("approved") boolean approved, @Param("approvedBy") String approvedBy,
                   @Param("stage") String stage, @Param("rejectReason") String rejectReason);
}
