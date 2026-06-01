package com.smartehs.mapper;

import com.smartehs.model.CodeGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CodeGroupMapper {

    List<CodeGroup> findAll();

    List<CodeGroup> findByKeyword(@Param("keyword") String keyword);

    CodeGroup findById(@Param("id") Long id);

    CodeGroup findByGroupCode(@Param("groupCode") String groupCode);

    void insert(CodeGroup codeGroup);

    void update(CodeGroup codeGroup);

    void delete(@Param("id") Long id);
}
