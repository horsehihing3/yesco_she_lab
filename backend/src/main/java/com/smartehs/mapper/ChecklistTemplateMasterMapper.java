package com.smartehs.mapper;

import com.smartehs.model.ChecklistTemplateMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChecklistTemplateMasterMapper {
    List<ChecklistTemplateMaster> findAll();
    List<ChecklistTemplateMaster> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    ChecklistTemplateMaster findById(@Param("id") Long id);
    List<ChecklistTemplateMaster> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);
    int countByTitleContaining(@Param("title") String title);
    void insert(ChecklistTemplateMaster master);
    void update(ChecklistTemplateMaster master);
    void delete(@Param("id") Long id);
}
