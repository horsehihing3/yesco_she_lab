package com.smartehs.mapper;

import com.smartehs.model.NotificationUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationUserMapper {

    List<NotificationUser> findAll();

    NotificationUser findById(@Param("id") Long id);

    NotificationUser findByCode(@Param("code") String code);

    void insert(NotificationUser notificationUser);

    void update(NotificationUser notificationUser);

    void delete(@Param("id") Long id);
}
