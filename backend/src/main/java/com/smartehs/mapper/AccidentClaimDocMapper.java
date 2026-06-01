package com.smartehs.mapper;

import com.smartehs.model.AccidentClaimDoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccidentClaimDocMapper {

    List<AccidentClaimDoc> findByClaimId(@Param("claimId") Long claimId);

    void insert(AccidentClaimDoc doc);

    void updateSubmitted(@Param("id") Long id, @Param("isSubmitted") boolean isSubmitted);

    void toggleSubmitted(@Param("id") Long id);

    void deleteByClaimId(@Param("claimId") Long claimId);
}
