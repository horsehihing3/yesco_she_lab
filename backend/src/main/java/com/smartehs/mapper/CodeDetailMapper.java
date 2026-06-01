package com.smartehs.mapper;

import com.smartehs.model.CodeDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CodeDetailMapper {

    List<CodeDetail> findByGroupId(@Param("groupId") Long groupId);

    List<CodeDetail> findByGroupIdAndKeyword(@Param("groupId") Long groupId, @Param("keyword") String keyword);

    CodeDetail findById(@Param("id") Long id);

    CodeDetail findByGroupIdAndCode(@Param("groupId") Long groupId, @Param("code") String code);

    void insert(CodeDetail codeDetail);

    void update(CodeDetail codeDetail);

    void delete(@Param("id") Long id);

    void deleteByGroupId(@Param("groupId") Long groupId);

    List<CodeDetail> findByGroupCode(@Param("groupCode") String groupCode);
}
