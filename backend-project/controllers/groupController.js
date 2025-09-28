const Group = require('../models/groupModel');
const User = require('../models/userModel');

const groupController = {
  // 创建群组
  createGroup: async (req, res) => {
    try {
      const { name, description, memberIds = [] } = req.body;
      const creatorId = req.user.id;

      // 验证输入
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: '群组名称不能为空' });
      }

      // 创建群组
      const groupId = await Group.create({ 
        name: name.trim(), 
        description: description?.trim() || '', 
        created_by: creatorId 
      });

      // 添加创建者为群组所有者
      await Group.addMember(groupId, creatorId, 'owner');

      // 添加其他成员
      for (const memberId of memberIds) {
        if (memberId != creatorId) {
          await Group.addMember(groupId, memberId, 'member');
        }
      }

      // 获取完整的群组信息
      const group = await Group.getById(groupId);

      res.status(201).json({
        message: '群组创建成功',
        data: group
      });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ message: '创建群组时发生错误' });
    }
  },

  // 获取用户所属的群组
  getUserGroups: async (req, res) => {
    try {
      const userId = req.user.id;
      const groups = await Group.getUserGroups(userId);

      res.json({
        message: '获取群组列表成功',
        data: groups
      });
    } catch (error) {
      console.error('Get user groups error:', error);
      res.status(500).json({ message: '获取群组列表时发生错误' });
    }
  },

  // 获取群组详细信息
  getGroupDetails: async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // 检查用户是否为群组成员
      const isMember = await Group.isMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: '您不是该群组的成员' });
      }

      const group = await Group.getById(groupId);
      const members = await Group.getMembers(groupId);

      res.json({
        message: '获取群组详情成功',
        data: { group, members }
      });
    } catch (error) {
      console.error('Get group details error:', error);
      res.status(500).json({ message: '获取群组详情时发生错误' });
    }
  },

  // 更新群组信息
  updateGroup: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { name, description } = req.body;
      const userId = req.user.id;

      // 检查用户是否为群组管理员
      const isAdmin = await Group.isAdmin(groupId, userId);
      if (!isAdmin) {
        return res.status(403).json({ message: '只有群组管理员可以修改群组信息' });
      }

      // 验证输入
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: '群组名称不能为空' });
      }

      const affectedRows = await Group.update(groupId, { 
        name: name.trim(), 
        description: description?.trim() || '' 
      });

      if (affectedRows === 0) {
        return res.status(404).json({ message: '群组不存在' });
      }

      const group = await Group.getById(groupId);

      res.json({
        message: '群组信息更新成功',
        data: group
      });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({ message: '更新群组信息时发生错误' });
    }
  },

  // 删除群组
  deleteGroup: async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // 检查用户是否为群组创建者
      const group = await Group.getById(groupId);
      if (!group || group.created_by != userId) {
        return res.status(403).json({ message: '只有群组创建者可以删除群组' });
      }

      const affectedRows = await Group.delete(groupId);

      if (affectedRows === 0) {
        return res.status(404).json({ message: '群组不存在' });
      }

      res.json({ message: '群组删除成功' });
    } catch (error) {
      console.error('Delete group error:', error);
      res.status(500).json({ message: '删除群组时发生错误' });
    }
  },

  // 添加群组成员
  addMember: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;
      const requesterId = req.user.id;

      // 检查请求者是否为群组管理员
      const isAdmin = await Group.isAdmin(groupId, requesterId);
      if (!isAdmin) {
        return res.status(403).json({ message: '只有群组管理员可以添加成员' });
      }

      // 检查用户是否存在
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // 检查用户是否已经是群组成员
      const isMember = await Group.isMember(groupId, userId);
      if (isMember) {
        return res.status(400).json({ message: '用户已经是群组成员' });
      }

      await Group.addMember(groupId, userId);

      res.json({ message: '成员添加成功' });
    } catch (error) {
      console.error('Add member error:', error);
      res.status(500).json({ message: '添加成员时发生错误' });
    }
  },

  // 移除群组成员
  removeMember: async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const requesterId = req.user.id;

      // 检查请求者是否为群组管理员
      const isAdmin = await Group.isAdmin(groupId, requesterId);
      if (!isAdmin) {
        return res.status(403).json({ message: '只有群组管理员可以移除成员' });
      }

      // 不能移除自己（除非是普通成员）
      if (requesterId == userId) {
        const requesterRole = await Group.getMemberRole(groupId, requesterId);
        if (requesterRole !== 'member') {
          return res.status(400).json({ message: '管理员不能直接移除自己，请先转让权限' });
        }
      }

      const affectedRows = await Group.removeMember(groupId, userId);

      if (affectedRows === 0) {
        return res.status(404).json({ message: '成员不存在' });
      }

      res.json({ message: '成员移除成功' });
    } catch (error) {
      if (error.message === 'Cannot remove group owner') {
        return res.status(400).json({ message: '不能移除群组创建者' });
      }
      console.error('Remove member error:', error);
      res.status(500).json({ message: '移除成员时发生错误' });
    }
  },

  // 发送群组消息
  sendMessage: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { content } = req.body;
      const senderId = req.user.id;

      // 验证输入
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: '消息内容不能为空' });
      }

      // 检查用户是否为群组成员
      const isMember = await Group.isMember(groupId, senderId);
      if (!isMember) {
        return res.status(403).json({ message: '您不是该群组的成员' });
      }

      const messageId = await Group.sendMessage({ 
        group_id: groupId, 
        sender_id: senderId, 
        content: content.trim() 
      });

      res.status(201).json({
        message: '消息发送成功',
        data: { id: messageId }
      });
    } catch (error) {
      console.error('Send group message error:', error);
      res.status(500).json({ message: '发送消息时发生错误' });
    }
  },

  // 获取群组消息
  getMessages: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      // 检查用户是否为群组成员
      const isMember = await Group.isMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: '您不是该群组的成员' });
      }

      const messages = await Group.getMessages(groupId, limit, offset);

      res.json({
        message: '获取消息成功',
        data: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length
        }
      });
    } catch (error) {
      console.error('Get group messages error:', error);
      res.status(500).json({ message: '获取消息时发生错误' });
    }
  },

  // 搜索群组
  searchGroups: async (req, res) => {
    try {
      const { keyword } = req.query;
      const userId = req.user.id;

      if (!keyword || keyword.trim().length === 0) {
        return res.status(400).json({ message: '搜索关键词不能为空' });
      }

      const groups = await Group.search(keyword.trim(), userId);

      res.json({
        message: '搜索成功',
        data: groups
      });
    } catch (error) {
      console.error('Search groups error:', error);
      res.status(500).json({ message: '搜索群组时发生错误' });
    }
  }
};

module.exports = groupController;