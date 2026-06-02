package com.smartehs.mapper;

import com.smartehs.model.IdmCompany;
import com.smartehs.model.IdmGroup;
import com.smartehs.model.IdmUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface IdmMapper {
    List<IdmCompany> findActiveCompanies();
    List<IdmGroup> findActiveGroups();
    List<IdmUser> findActiveEmployees();

    IdmUser findByUid(@Param("uid") String uid);
    IdmUser findByUidNumber(@Param("uidNumber") Long uidNumber);
    IdmUser findByEmail(@Param("email") String email);
    List<IdmUser> findAllWithPassword();
    void updateUserRole(@Param("uid") String uid, @Param("userRole") String userRole);
}
