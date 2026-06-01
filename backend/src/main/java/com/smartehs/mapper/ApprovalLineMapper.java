package com.smartehs.mapper;

import com.smartehs.model.ApprovalLine;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ApprovalLineMapper {

    List<ApprovalLine> findByApprovalItemCodeAndDeptCode(
            @Param("approvalItemCode") String approvalItemCode,
            @Param("deptCode") String deptCode);

    ApprovalLine findById(@Param("id") Long id);

    void insert(ApprovalLine approvalLine);

    void update(ApprovalLine approvalLine);

    void delete(@Param("id") Long id);

    void deleteByApprovalItemCodeAndDeptCode(
            @Param("approvalItemCode") String approvalItemCode,
            @Param("deptCode") String deptCode);
}
