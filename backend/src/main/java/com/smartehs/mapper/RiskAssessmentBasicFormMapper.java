package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentBasicForm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentBasicFormMapper {

    List<RiskAssessmentBasicForm> findAll();

    List<RiskAssessmentBasicForm> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    RiskAssessmentBasicForm findById(@Param("id") Long id);

    List<RiskAssessmentBasicForm> findByFormCategory(@Param("formCategory") String formCategory);

    List<RiskAssessmentBasicForm> findByFormCategoryOrderBySortNoAsc(@Param("formCategory") String formCategory);

    List<RiskAssessmentBasicForm> findByFormCategoryContaining(@Param("formCategory") String formCategory, @Param("offset") int offset, @Param("limit") int limit);

    int countByFormCategoryContaining(@Param("formCategory") String formCategory);

    List<RiskAssessmentBasicForm> findByFormCategoryIdx(@Param("formCategoryIdx") Integer formCategoryIdx);

    void insert(RiskAssessmentBasicForm form);

    void update(RiskAssessmentBasicForm form);

    void delete(@Param("id") Long id);
}
