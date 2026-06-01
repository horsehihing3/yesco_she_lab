package com.smartehs.mapper;

import com.smartehs.model.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChecklistMapper {

    // Template
    List<ChecklistTemplate> findAllTemplates();
    ChecklistTemplate findTemplateById(@Param("id") Long id);
    void insertTemplate(ChecklistTemplate template);
    void insertTemplateWithOwner(ChecklistTemplate template);
    void updateTemplate(ChecklistTemplate template);
    void deleteTemplate(@Param("id") Long id);
    ChecklistTemplate findPrivateByOwner(@Param("ownerType") String ownerType, @Param("ownerId") Long ownerId);

    // Category
    List<ChecklistCategory> findCategoriesByTemplateId(@Param("templateId") Long templateId);
    ChecklistCategory findCategoryById(@Param("id") Long id);
    void insertCategory(ChecklistCategory category);
    void updateCategory(ChecklistCategory category);
    void deleteCategory(@Param("id") Long id);

    // Item
    List<ChecklistItem> findItemsByCategoryId(@Param("categoryId") Long categoryId);
    List<ChecklistItem> findItemsByTemplateId(@Param("templateId") Long templateId);
    ChecklistItem findItemById(@Param("id") Long id);
    void insertItem(ChecklistItem item);
    void updateItem(ChecklistItem item);
    void deleteItem(@Param("id") Long id);
    void deleteItemsByCategoryId(@Param("categoryId") Long categoryId);
    void deleteResultsByTemplateId(@Param("templateId") Long templateId);
    void deleteItemsByTemplateId(@Param("templateId") Long templateId);
    void deleteCategoriesByTemplateId(@Param("templateId") Long templateId);
    Integer findMaxItemNoByTemplateId(@Param("templateId") Long templateId);

    // Inspection
    List<ChecklistInspection> findInspectionsByTemplateId(@Param("templateId") Long templateId);
    ChecklistInspection findInspectionById(@Param("id") Long id);
    ChecklistInspection findInspectionByRiskAssessmentAndTemplate(@Param("riskAssessmentId") Long riskAssessmentId, @Param("templateId") Long templateId);
    void insertInspection(ChecklistInspection inspection);
    void updateInspection(ChecklistInspection inspection);
    void deleteInspection(@Param("id") Long id);

    // Inspection Result
    List<ChecklistInspectionResult> findResultsByInspectionId(@Param("inspectionId") Long inspectionId);
    void insertResult(ChecklistInspectionResult result);
    void updateResult(ChecklistInspectionResult result);
    void deleteResultsByInspectionId(@Param("inspectionId") Long inspectionId);
}
