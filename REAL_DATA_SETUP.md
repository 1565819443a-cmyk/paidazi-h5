# π搭子真实数据版上线清单

真实版链接：

https://paidazi-real-h5.vercel.app

计划给朋友测试的正式入口：

https://real.paidazi.cn

`real.paidazi.cn` 已添加到 Vercel 项目 `paidazi-real-h5`。如果还打不开，需要在域名 DNS 后台添加：

```text
类型：A
主机记录：real
记录值：76.76.21.21
```

当前版本已经和原来的 `https://paidazi.cn` 分开部署，不会覆盖演示版。

## 必做 1：创建真实版数据库表

在 Supabase 后台打开当前项目，进入 SQL Editor，完整执行：

```text
supabase-real-schema.sql
```

这份 SQL 只创建 `real_*` 开头的新表和权限策略，不会修改旧演示版表。

## 访问方式

当前版本已取消邮箱验证码登录，适合直接把链接小范围发给朋友体验：

```text
https://real.paidazi.cn
https://real.paidazi.cn/login
```

打开后会使用本机访客身份进入。发布、评论、收藏和个人资料仍然写入真实数据环境；访客昵称和头像保存在当前浏览器本地。

## 已完成

- 新建独立 Vercel 项目 `paidazi-real-h5`。
- Production 链接已生成。
- Vercel Production 环境变量已保存。
- 取消邮箱验证码登录，改为本机访客身份直接进入。
- 社区、发布、评论、收藏、邀请、我的发布、我的邀请改为真实表读写。
- 删除了旧的虚拟用户、虚拟聊天、虚拟组队、虚拟帖子数据引用。

## 后续可选

- 绑定自己的二级域名，比如 `real.paidazi.cn`。
- 增加站内私信真实消息表。
- 增加管理员后台做内容审核。
