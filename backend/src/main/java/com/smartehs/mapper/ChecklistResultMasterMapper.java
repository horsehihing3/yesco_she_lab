package com.smartehs.mapper;

import com.smartehs.model.ChecklistResultMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChecklistResultMasterMapper {
    List<ChecklistResultMaster> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    ChecklistResultMaster findById(@Param("id") Long id);
    List<ChecklistResultMaster> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);
    int countByTitleContaining(@Param("title") String title);
    void insert(ChecklistResultMaster master);
    void update(ChecklistResultMaster master);
    void delete(@Param("id") Long id);
}
