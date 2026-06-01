package com.smartehs.mapper;

import com.smartehs.model.DisposalCompany;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DisposalCompanyMapper {

    List<DisposalCompany> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    DisposalCompany findById(@Param("id") Long id);

    List<DisposalCompany> findByCompanyNameContaining(@Param("companyName") String companyName, @Param("offset") int offset, @Param("limit") int limit);

    int countByCompanyNameContaining(@Param("companyName") String companyName);

    List<DisposalCompany> findAllActive();

    void insert(DisposalCompany disposalCompany);

    void update(DisposalCompany disposalCompany);

    void delete(@Param("id") Long id);
}
