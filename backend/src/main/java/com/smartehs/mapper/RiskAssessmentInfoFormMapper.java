package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentInfoForm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentInfoFormMapper {

    List<RiskAssessmentInfoForm> findAll();

    List<RiskAssessmentInfoForm> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    RiskAssessmentInfoForm findById(@Param("id") Long id);

    RiskAssessmentInfoForm findByRiskId(@Param("riskId") String riskId);

    List<RiskAssessmentInfoForm> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContaining(@Param("title") String title);

    List<RiskAssessmentInfoForm> findBySite(@Param("site") String site, @Param("offset") int offset, @Param("limit") int limit);

    int countBySite(@Param("site") String site);

    List<RiskAssessmentInfoForm> findByApproval(@Param("approval") String approval, @Param("offset") int offset, @Param("limit") int limit);

    int countByApproval(@Param("approval") String approval);

    List<RiskAssessmentInfoForm> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<RiskAssessmentInfoForm> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    List<RiskAssessmentInfoForm> findByAuthorMailAndDeletedFalse(@Param("authorMail") String authorMail, @Param("offset") int offset, @Param("limit") int limit);

    int countByAuthorMailAndDeletedFalse(@Param("authorMail") String authorMail);

    int countByStatusAndDeletedFalse(@Param("status") String status);

    void insert(RiskAssessmentInfoForm form);

    void update(RiskAssessmentInfoForm form);

    void delete(@Param("id") Long id);

    void softDelete(@Param("id") Long id);
}
