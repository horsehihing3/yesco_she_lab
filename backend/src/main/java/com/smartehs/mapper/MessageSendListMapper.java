package com.smartehs.mapper;

import com.smartehs.model.MessageSendList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MessageSendListMapper {

    List<MessageSendList> findAll();

    MessageSendList findById(@Param("id") Long id);

    List<MessageSendList> findByGroupName(@Param("groupName") String groupName);

    void insert(MessageSendList messageSendList);

    void update(MessageSendList messageSendList);

    void delete(@Param("id") Long id);
}
