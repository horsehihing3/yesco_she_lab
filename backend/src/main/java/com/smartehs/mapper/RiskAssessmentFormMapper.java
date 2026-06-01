package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentForm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentFormMapper {

    List<RiskAssessmentForm> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    RiskAssessmentForm findById(@Param("id") Long id);

    List<RiskAssessmentForm> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContaining(@Param("title") String title);

    List<RiskAssessmentForm> findAll();

    void insert(RiskAssessmentForm form);

    void update(RiskAssessmentForm form);

    void delete(@Param("id") Long id);
}
