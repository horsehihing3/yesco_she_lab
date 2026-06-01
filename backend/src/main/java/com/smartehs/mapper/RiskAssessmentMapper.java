package com.smartehs.mapper;

import com.smartehs.model.RiskAssessment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentMapper {

    List<RiskAssessment> findAll(@Param("offset") int offset, @Param("limit") int limit);

    List<RiskAssessment> findBySite(@Param("site") String site, @Param("offset") int offset, @Param("limit") int limit);

    List<RiskAssessment> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    int countBySite(@Param("site") String site);

    int countByStatus(@Param("status") String status);

    int countByFormId(@Param("formId") Long formId);

    RiskAssessment findById(@Param("id") Long id);

    RiskAssessment findByRiskId(@Param("riskId") String riskId);

    void insert(RiskAssessment riskAssessment);

    void update(RiskAssessment riskAssessment);

    void updateStatus(@Param("id") Long id, @Param("status") String status,
                      @Param("rejectReason") String rejectReason, @Param("allowResubmit") Boolean allowResubmit);

    /** 결재 전이: stage="PLAN" 이면 plan_approved_*, "COMPLETION" 이면 completion_approved_* 에 stamp */
    void transition(@Param("id") Long id,
                    @Param("status") String status,
                    @Param("approved") boolean approved,
                    @Param("approvedBy") String approvedBy,
                    @Param("stage") String stage,
                    @Param("rejectReason") String rejectReason);

    void updateCounts(@Param("riskId") String riskId, @Param("officeCount") Integer officeCount,
                      @Param("fieldCount") Integer fieldCount);

    void updateRiskRegisterCount(@Param("riskId") String riskId, @Param("count") Integer count);

    void delete(@Param("id") Long id);
}
