package com.smartehs.mapper;

import com.smartehs.model.ContractorEvalItem;
import com.smartehs.model.ContractorEvalTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ContractorEvalMapper {

    List<ContractorEvalTemplate> findAllTemplates();

    ContractorEvalTemplate findTemplateById(@Param("id") Long id);

    List<ContractorEvalItem> findItemsByTemplateId(@Param("templateId") Long templateId);

    void insertItem(ContractorEvalItem item);

    void updateItem(ContractorEvalItem item);

    void deleteItemsByTemplateId(@Param("templateId") Long templateId);

    void updateTemplateMeta(ContractorEvalTemplate template);
}
