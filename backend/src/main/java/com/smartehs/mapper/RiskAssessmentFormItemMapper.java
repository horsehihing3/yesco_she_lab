package com.smartehs.mapper;

import com.smartehs.model.RiskAssessmentFormItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RiskAssessmentFormItemMapper {

    List<RiskAssessmentFormItem> findByFormId(@Param("formId") Long formId);

    int countByFormId(@Param("formId") Long formId);

    void insert(RiskAssessmentFormItem item);

    void deleteByFormId(@Param("formId") Long formId);
}
