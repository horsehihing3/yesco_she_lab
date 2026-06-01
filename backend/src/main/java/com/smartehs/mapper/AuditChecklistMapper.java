package com.smartehs.mapper;

import com.smartehs.model.AuditChecklistItem;
import com.smartehs.model.AuditChecklistResult;
import com.smartehs.model.AuditChecklistTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditChecklistMapper {

    // Template CRUD
    List<AuditChecklistTemplate> findAllTemplates(@Param("offset") int offset, @Param("limit") int limit);

    int countAllTemplates();

    AuditChecklistTemplate findTemplateById(@Param("id") Long id);

    List<AuditChecklistTemplate> findTemplatesByAuditType(@Param("auditType") String auditType);

    void insertTemplate(AuditChecklistTemplate template);

    void updateTemplate(AuditChecklistTemplate template);

    void softDeleteTemplate(@Param("id") Long id);

    int countByTemplateIdStartingWith(@Param("prefix") String prefix);

    // Item CRUD
    List<AuditChecklistItem> findItemsByTemplateId(@Param("templateId") Long templateId);

    AuditChecklistItem findItemById(@Param("id") Long id);

    void insertItem(AuditChecklistItem item);

    void updateItem(AuditChecklistItem item);

    void softDeleteItem(@Param("id") Long id);

    void deleteItemsByTemplateId(@Param("templateId") Long templateId);

    // Result CRUD
    void initResults(@Param("auditId") Long auditId, @Param("templateId") Long templateId);

    List<AuditChecklistResult> findResultsByAuditId(@Param("auditId") Long auditId);

    void updateResult(AuditChecklistResult result);
}
