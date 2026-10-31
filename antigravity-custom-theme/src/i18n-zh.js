// Antigravity 界面中文词典（独立编写）。只翻界面文案：按钮、菜单、标签、提示、占位符。
// 不翻：产品与模型名（Gemini、Flash、Turbo、MCP）、项目名、会话标题、代码与消息正文。
// 精确匹配；多词短语额外做忽略大小写匹配。动态文案写在 patterns 里。
module.exports.exact = {
  // 顶部菜单与导航
  'Workspace': '工作区', 'Workspaces': '工作区', 'View': '视图', 'Window': '窗口', 'Edit': '编辑',
  'New Conversation': '新建会话', 'Automations': '自动化', 'Customizations': '自定义', 'Projects': '项目',
  'Project': '项目', 'Settings': '设置', 'Sidebar': '侧栏', 'Conversations': '会话', 'Conversation': '会话',
  'Agents': '智能体', 'Agent': '智能体', 'Subagents': '子智能体', 'Artifacts': '产出物', 'Artifact': '产出物',
  'Skills': '技能', 'Rules': '规则', 'Plugins': '插件', 'Hooks': '钩子', 'Commands': '命令', 'Terminal': '终端',
  'Terminals': '终端', 'Files': '文件', 'Documents': '文档', 'Uploads': '上传', 'Changes': '更改', 'Comments': '评论',
  'Review': '审阅', 'Overview': '概览', 'Logs': '日志', 'Output': '输出', 'Status': '状态', 'Details': '详情',
  'Notifications': '通知', 'Account': '账号', 'Accounts': '账号', 'Appearance': '外观', 'General': '通用',
  'Advanced': '高级', 'Developer': '开发者', 'Application': '应用', 'Permissions': '权限', 'Usage': '用量',
  'Quota': '配额', 'Model Quota': '模型配额', 'Theme': '主题', 'Themes': '主题', 'Display': '显示', 'Sound': '声音',
  'Shortcuts': '快捷键', 'Extensions': '扩展', 'Marketplace': '市场', 'Browser': '浏览器', 'Voice': '语音',
  'Telemetry': '遥测', 'Connections': '连接', 'Navigation': '导航', 'Search': '搜索', 'Code Search': '代码搜索',

  // 侧栏与会话
  'Display Options': '显示选项', 'Create New Project': '新建项目', 'Create Project': '创建项目', 'New Project': '新建项目',
  'Project options': '项目选项', 'Project Settings': '项目设置', 'Open project settings': '打开项目设置',
  'New Conversation in Project': '在项目中新建会话', 'More options': '更多选项', 'More actions': '更多操作',
  'More Actions': '更多操作', 'More': '更多', 'Pin conversation': '置顶会话', 'Archive conversation': '归档会话',
  'Pin This Conversation': '置顶此会话', 'Unpin This Conversation': '取消置顶', 'Archive This Conversation': '归档此会话',
  'Delete Conversation': '删除会话', 'Rename Conversation': '重命名会话', 'Rename This Conversation': '重命名此会话',
  'Fork Conversation': '复刻会话', 'Fork': '复刻', 'Conversation Archived': '会话已归档', 'Conversation History': '会话历史',
  'Open Conversation History': '打开会话历史', 'Open Conversation': '打开会话', 'Open Conversation in New Tab': '在新标签页打开会话',
  'Conversation name': '会话名称', 'Conversation Name': '会话名称', 'Copy Conversation Markdown': '复制会话 Markdown',
  'Copy Conversation ID': '复制会话 ID', 'Find in Conversation': '在会话中查找', 'Pinned Conversations': '置顶会话',
  'Search Conversations': '搜索会话', 'Search conversations...': '搜索会话…', 'Search for conversations...': '搜索会话…',
  'No conversations yet': '还没有会话', 'Mark All as Read': '全部标为已读', 'Mark as Read': '标为已读', 'Mark as Unread': '标为未读',
  'Mark This Conversation as Read': '将此会话标为已读', 'Mark This Conversation as Unread': '将此会话标为未读',
  'Move Conversation Up': '上移会话', 'Move Conversation Down': '下移会话', 'Sort Conversations': '会话排序',
  'Select Next Conversation': '下一个会话', 'Select Previous Conversation': '上一个会话', 'Open Conversation Picker': '打开会话选择器',
  'Split Conversation Horizontally': '水平拆分会话', 'Split Conversation Vertically': '垂直拆分会话',
  'Group By': '分组方式', 'Group By Project': '按项目分组', 'Group By Workspace': '按工作区分组', 'Sort By': '排序方式',
  'New Group': '新建分组', 'Rename Group': '重命名分组', 'Move to Group': '移到分组', 'Move to New Group': '移到新分组',
  'Remove from Group': '移出分组', 'Group name': '分组名称', 'Custom Order': '自定义顺序', 'Last Updated': '最近更新',
  'Archive': '归档', 'Archive project': '归档项目', 'Archive Workspace': '归档工作区', 'Search projects...': '搜索项目…',
  'Enter project name...': '输入项目名称…', 'Project Name': '项目名称', 'Toggle Sidebar': '切换侧栏', 'Toggle sidebar': '切换侧栏',
  'Close Sidebar': '关闭侧栏', 'Go Back': '后退', 'Go Forward': '前进', 'Back': '返回', 'Forward': '前进', 'Back to home': '返回首页',

  // 输入框与发送
  'Ask anything, @ to mention, / for actions': '问点什么，@ 提及，/ 调用操作', 'Add context': '添加上下文', 'Add files': '添加文件',
  'Send message': '发送消息', 'Send': '发送', 'Send Now': '立即发送', 'Message input': '消息输入框', 'Upload Files': '上传文件',
  'Select Environment': '选择环境', 'Toggle Environment Selector': '切换环境选择', 'Local Checkout': '本地检出',
  'Configure Branches': '配置分支', 'Select Model': '选择模型', 'Select another model': '选择其他模型', 'No Model Selected': '未选择模型',
  'No Models Available': '没有可用模型', 'Toggle Model Selector': '切换模型选择', 'Toggle Project Selector': '切换项目选择',
  'Select Agent': '选择智能体', 'Cancel Generation': '停止生成', 'Cancel Sending Message': '取消发送', 'Continue Response': '继续回复',
  'Start Voice Recording': '开始录音', 'Stop Voice Recording': '停止录音', 'Toggle Voice Recording': '切换录音',
  'Add screenshot to conversation': '把截图加入会话', 'Queued messages': '排队中的消息', 'Queued Messages': '排队中的消息',
  'Focus Input': '聚焦输入框', 'Mentions': '提及', 'Typeahead menu': '联想菜单', 'Context usage': '上下文用量', 'Context window': '上下文窗口',

  // 通用操作
  'Close': '关闭', 'Close (Esc)': '关闭 (Esc)', 'Cancel': '取消', 'Confirm': '确认', 'Done': '完成', 'OK': '确定', 'Got it': '知道了',
  'Copy': '复制', 'Copied': '已复制', 'Cut': '剪切', 'Paste': '粘贴', 'Select All': '全选', 'Undo': '撤销', 'Delete': '删除',
  'Remove': '移除', 'Rename': '重命名', 'Refresh': '刷新', 'Reload': '重新加载', 'Reload app': '重新加载应用', 'Restore': '恢复',
  'Dismiss': '关闭', 'Clear': '清除', 'Clear search': '清除搜索', 'Clear Search': '清除搜索', 'Clear filter': '清除筛选',
  'Filter': '筛选', 'Open': '打开', 'Open File': '打开文件', 'Open Folder': '打开文件夹', 'Download': '下载', 'Download File': '下载文件',
  'Share': '分享', 'Preview': '预览', 'Options': '选项', 'Actions': '操作', 'Learn more': '了解更多', 'More info': '更多信息',
  'See all': '查看全部', 'See more results': '查看更多结果', 'Allow': '允许', 'Allow Once': '允许一次', 'Always Allow': '始终允许',
  'Deny': '拒绝', 'Block': '阻止', 'Always Ask': '始终询问', 'Always Proceed': '始终继续', 'Connect': '连接', 'Disconnect': '断开连接',
  'Authenticate': '认证', 'Discard': '放弃', 'Stop': '停止', 'Stop execution': '停止执行', 'Find': '查找', 'Replace with': '替换为',
  'Match case': '区分大小写', 'Match whole word': '全字匹配', 'Use regular expression': '使用正则表达式',
  'Next match': '下一个匹配', 'Previous match': '上一个匹配', 'Next Page': '下一页', 'Previous Page': '上一页', 'Current Page': '当前页',
  'Copy Path': '复制路径', 'Copy path': '复制路径', 'Copy File Path': '复制文件路径', 'Copy File Name': '复制文件名',
  'Copy Link': '复制链接', 'Copy Image': '复制图片', 'Copy Message': '复制消息', 'Copy Command': '复制命令', 'Copy command': '复制命令',
  'Copy Content': '复制内容', 'Copy error to clipboard': '复制错误信息', 'Link copied to clipboard.': '链接已复制。',
  'Open in new tab': '在新标签页打开', 'Open in New Tab': '在新标签页打开', 'Open in New Window': '在新窗口打开',
  'Open in external browser': '在外部浏览器打开', 'Open in External Browser': '在外部浏览器打开', 'Open in Built-in Browser': '在内置浏览器打开',
  'Open Link in New Tab': '在新标签页打开链接', 'Open Link in External Browser': '在外部浏览器打开链接', 'Open in side pane': '在侧边面板打开',
  'Open in Side Panel': '在侧边面板打开', 'Open Settings': '打开设置', 'Open settings menu': '打开设置菜单', 'Close Settings': '关闭设置',
  'Open Command Palette': '打开命令面板', 'Command Palette': '命令面板', 'Open Keyboard Shortcuts': '打开键盘快捷键',
  'Open File Search': '打开文件搜索', 'Open Search': '打开搜索', 'Provide Feedback': '提供反馈', 'Check for Updates': '检查更新',
  'Update Available': '有可用更新', 'Reset to Default': '恢复默认', 'Reset All to Defaults': '全部恢复默认', 'Reset zoom': '重置缩放',
  'Reset Zoom': '重置缩放', 'Zoom In': '放大', 'Zoom Out': '缩小', 'Zoom in': '放大', 'Zoom out': '缩小', 'Zoom Level': '缩放级别',
  'Minimize': '最小化', 'Maximize': '最大化', 'New Window': '新建窗口', 'New Tab': '新建标签页', 'New tab': '新建标签页',
  'Close Tab': '关闭标签页', 'Close Other Tabs': '关闭其他标签页', 'Close Tabs to the Right': '关闭右侧标签页', 'Reopen Closed Tab': '重新打开已关闭的标签页',
  'Close panel': '关闭面板', 'Close Panel': '关闭面板', 'Split': '拆分', 'Split Right': '向右拆分', 'Split Down': '向下拆分',
  'Toggle Auxiliary Pane': '切换辅助面板', 'Toggle Maximize Auxiliary Pane': '最大化辅助面板', 'Toggle Overview Panel': '切换概览面板',
  'Toggle Terminal': '切换终端', 'Toggle File Viewer': '切换文件查看器', 'Toggle Thumbnails': '切换缩略图', 'Thumbnails': '缩略图',

  // 状态
  'Ready': '就绪', 'Idle': '空闲', 'Running': '运行中', 'Starting': '启动中', 'Stopped': '已停止', 'Pending': '等待中',
  'Completed': '已完成', 'In Progress': '进行中', 'Blocked': '已阻止', 'Disabled': '已停用', 'Installed': '已安装', 'Currently installed': '当前已安装',
  'Error': '错误', 'Errors': '错误', 'Unknown': '未知', 'Unknown error': '未知错误', 'Online': '在线', 'Offline': '离线',
  'Thinking': '思考中', 'Thinking...': '思考中…', 'Searching': '搜索中', 'Input required': '需要输入', 'Action required': '需要操作',
  'Setup required': '需要设置', 'Sign-in required': '需要登录', 'Sign in required.': '需要登录。', 'Not Signed In': '未登录',
  'Authentication expired': '认证已过期', 'Authenticating...': '认证中…', 'Modified': '已修改', 'Deleted': '已删除', 'Renamed': '已重命名',
  'Uncommitted': '未提交', 'Copied!': '已复制！', 'Render failed': '渲染失败', 'Failed to render diagram': '图表渲染失败',
  'Your changes were not saved. Please try again.': '更改没有保存，请重试。', 'Model quota reached': '模型配额已用完',

  // 智能体与执行
  'Agent Edits': '智能体改动', 'Autonomous Mode': '自主模式', 'Background Commands': '后台命令', 'Background Tasks': '后台任务',
  'Background Task Output': '后台任务输出', 'Terminal Commands': '终端命令', 'Cancel Task': '取消任务', 'Cancel All Tasks': '取消全部任务',
  'Stop subagent': '停止子智能体', 'Stop Subagent': '停止子智能体', 'Stop All Subagents': '停止所有子智能体', 'Custom Agents': '自定义智能体',
  'Agent options': '智能体选项', 'Agent response': '智能体回复', 'Agent Behavior': '智能体行为', 'Accept Step': '接受此步', 'Reject Step': '拒绝此步',
  'Proceed with Plan': '按计划执行', 'Plan': '计划', 'Goals': '目标', 'Files Changed': '已更改的文件', 'Modified Files': '已修改的文件',
  'Branch Changes': '分支更改', 'Staged Changes': '已暂存的更改', 'Revert file changes': '撤销文件改动', 'Undo to Here': '撤销到这里',
  'Commit': '提交', 'Push': '推送', 'Branch': '分支', 'Select branch': '选择分支', 'No branches': '没有分支', 'Worktree': '工作树',
  'New Worktree': '新建工作树', 'Run in a new worktree': '在新工作树中运行', 'Run in your current workspace': '在当前工作区运行',
  'Runs on this computer': '在本机运行', 'Runs in the cloud': '在云端运行', 'This Computer': '本机', 'This computer': '本机', 'Cloud': '云端', 'Local': '本地',
  'MCP Servers': 'MCP 服务器', 'MCP servers': 'MCP 服务器', 'Add MCP Server': '添加 MCP 服务器', 'Add MCP Servers': '添加 MCP 服务器',
  'Installed MCP Servers': '已安装的 MCP 服务器', 'MCP Tools': 'MCP 工具', 'MCP tools': 'MCP 工具', 'Refresh MCP servers': '刷新 MCP 服务器',
  'Search MCP servers by name': '按名称搜索 MCP 服务器', 'Installed Skills': '已安装的技能', 'Active Skills': '启用中的技能', 'Refresh skills': '刷新技能',
  'Skills & Rules': '技能与规则', 'Manage Hooks': '管理钩子', 'Default Customizations': '默认自定义', 'Search customizations...': '搜索自定义…',
  'Refresh customizations': '刷新自定义', 'Browse the Marketplace': '浏览市场', 'More Plugins': '更多插件', 'Plugin details': '插件详情',
  'Scheduled Tasks': '定时任务', 'Daily': '每天', 'Weekly': '每周', 'Hourly': '每小时', 'Remote Control': '远程控制',
  'Enable Remote Control': '启用远程控制', 'Add to Chat': '添加到对话', 'Terminal: Add to Chat': '终端：添加到对话',
  'New Terminal': '新建终端', 'New Terminal Tab': '新建终端标签页', 'Split Terminal': '拆分终端', 'Kill Terminal': '结束终端', 'Delete Terminal': '删除终端',
  'Open Terminal': '打开终端', 'Insert in terminal': '插入到终端',

  // 设置页
  'Permission Settings': '权限设置', 'Permission Preset': '权限预设', 'Security Preset': '安全预设', 'Global Permissions': '全局权限',
  'Local Permissions': '本地权限', 'File Permissions': '文件权限', 'Tool Permissions': '工具权限', 'Network Permissions': '网络权限',
  'Terminal & Tooling Permissions': '终端与工具权限', 'Review Policy': '审阅策略', 'Plan Review Policy': '计划审阅策略',
  'File Access Rules': '文件访问规则', 'Network Access Rules': '网络访问规则', 'File Reads': '读取文件', 'File Writes': '写入文件',
  'Read files': '读取文件', 'Write files': '写入文件', 'Strict Mode': '严格模式', 'Enable Terminal Sandbox': '启用终端沙箱',
  'Enable Sandbox Mode (Preview)': '启用沙箱模式（预览）', 'Sandbox Allow Network': '沙箱允许联网', 'Enable Browser Tools': '启用浏览器工具',
  'Enable Notifications': '启用通知', 'Enable Notifications for Agent': '智能体通知', 'Enable Sounds for Agent': '智能体提示音',
  'Enable Telemetry': '启用遥测', 'Notification Preferences': '通知偏好', 'Automatic Check for Updates': '自动检查更新',
  'Open Links In': '链接打开方式', 'Light Theme': '浅色主题', 'Dark Theme': '深色主题', 'System default': '跟随系统', 'Default': '默认',
  'Custom': '自定义', 'Conversation Width': '会话宽度', 'Markdown Artifact Width': 'Markdown 产出物宽度', 'Chat Settings': '对话设置',
  'Signed-in accounts': '已登录账号', 'Manage your model quota and credits.': '管理模型配额和点数。', 'Model Credits': '模型点数',
  'Purchase Credits': '购买点数', 'Token Usage': 'Token 用量', 'Danger Zone': '危险操作', 'Reset all shortcuts to defaults': '全部快捷键恢复默认',
  'Search shortcuts': '搜索快捷键', 'Add Shortcut': '添加快捷键', 'Edit Shortcut': '编辑快捷键', 'Remove Shortcut': '移除快捷键',
  'Settings Unavailable': '设置暂不可用', 'Labs': '实验功能', 'Prevent Sleep': '防止休眠', 'Keep In Menu Bar': '保留在菜单栏',
  'Monday': '星期一', 'Tuesday': '星期二', 'Wednesday': '星期三', 'Thursday': '星期四', 'Friday': '星期五', 'Saturday': '星期六', 'Sunday': '星期日',
  'Last 7 days': '最近 7 天', 'Recent files': '最近文件', 'Recent Files': '最近文件', 'Search across files...': '在文件中搜索…',
  'Search file contents...': '搜索文件内容…', 'Search for commands...': '搜索命令…', 'Search workspaces...': '搜索工作区…',
  'Current workspace': '当前工作区', 'Available workspaces': '可用工作区', 'Workspace Name': '工作区名称', 'Open Folder (Interactive)': '打开文件夹（交互）',
  'Expand All Folders': '展开全部文件夹', 'Collapse All Folders': '折叠全部文件夹', 'File Explorer': '文件资源管理器', 'File explorer': '文件资源管理器',
  'Log in to use the agent': '登录后使用智能体', 'To use the agent, please login': '请先登录再使用智能体', 'Log back in': '重新登录',
  'Continue with Google': '使用 Google 继续', 'Getting started with Google Antigravity': 'Google Antigravity 入门',
  'Good response': '回答不错', 'Bad response': '回答不好', 'Write a comment...': '写评论…', 'Add inline comment': '添加行内评论',
  'Delete comment': '删除评论', 'Edit comment': '编辑评论', 'View comments': '查看评论', 'Request Review': '请求审阅',

  // 设置页：分类与通用
  'Models': '模型', 'Show All': '全部显示', 'Show Less': '收起', 'Not in Project': '不在项目中', 'Give Feedback': '提交反馈',
  'Manage your plan, credentials, and general preferences.': '管理你的方案、凭据和常规偏好。',
  'When toggled on, Antigravity collects usage data to help Google enhance performance and features.': '开启后，Antigravity 会收集使用数据，帮助 Google 改进性能和功能。',
  'Marketing Emails': '营销邮件', 'Receive product updates, tips, and promotions from Google Antigravity via email.': '通过邮件接收 Google Antigravity 的产品更新、使用技巧和推广信息。',
  'Your Plan:': '当前方案：', 'You can upgrade to a Google AI Ultra plan to receive higher rate limits.': '升级到 Google AI Ultra 方案可获得更高的速率上限。',
  'Upgrade': '升级', 'Email': '邮箱', 'Sign Out': '退出登录', 'By using this app, you agree to its': '使用本应用即表示你同意其', 'Terms of Service': '服务条款',

  // 设置页：会话与权限
  'Configure global allowed and denied resource permissions.': '配置全局允许和禁止的资源权限。',
  'Controls the actions the agent can take.': '控制智能体可以执行的操作。', 'Modified in': '已修改于',
  'Modify permissions for file, terminal, and MCP tools.': '修改文件、终端和 MCP 工具的权限。',
  'Configure allowed and denied URLs for reading.': '配置允许和禁止读取的网址。', 'Whether the agent asks you to review its documents.': '智能体是否请你审阅它写的文档。',
  'and select': '并选择', 'to have the agent generate a plan.': '，让智能体生成计划。',
  'Execution': '执行', 'Configure agent execution, queued message delivery, and permissions.': '配置智能体执行、排队消息的发送方式和权限。',
  'Configure when follow-up messages are sent.': '配置追加消息何时发送。', 'Queue': '排队', 'Send Immediately': '立即发送',
  'Configure allowed and denied paths for file reads and writes.': '配置允许和禁止读写的文件路径。',
  'Configure allowed terminal commands.': '配置允许执行的终端命令。', 'Configure external tools via Model Context Protocol.': '通过 Model Context Protocol 配置外部工具。',
  'Also includes': '同时包含', 'when working': '，适用于', 'in these conversations': '这些会话', 'in this project': '此项目',
  'Inherit Global': '继承全局', 'Agent settings and permissions for conversations outside of projects.': '不属于任何项目的会话所用的智能体设置和权限。',
  'Manage project folders, agent settings, and permissions.': '管理项目文件夹、智能体设置和权限。',
  'Folders': '文件夹', 'Add Folder': '添加文件夹', 'Delete Project': '删除项目', 'Permanently delete': '永久删除', 'including': '，包括',

  // 设置页：浏览器
  'Keyboard shortcuts': '键盘快捷键', 'Built-in Browser': '内置浏览器', 'External Browser': '外部浏览器',
  'Configure link opening and built-in browser preferences.': '配置链接的打开方式和内置浏览器偏好。',
  'Choose where links open by default when clicked.': '选择点击链接时默认在哪里打开。',
  'Configure the browser subagent. It requires': '配置浏览器子智能体。需要先安装',
  'to be installed. The browser subagent can be invoked by typing /browser in the conversation input box.': '。在会话输入框中输入 /browser 即可调用浏览器子智能体。',
  'Browser Javascript Execution Policy': '浏览器 JavaScript 执行策略',
  'Controls whether the agent can run custom JavaScript to automate complex browser actions.': '控制智能体能否运行自定义 JavaScript 来自动完成复杂的浏览器操作。',
  'Browser Actuation Rules': '浏览器操作规则', 'Configure allowed and denied URLs for browser actuation.': '配置允许和禁止智能体操作的网址。',

  // 设置页：外观
  "Configure the agent's visual theme and display preferences.": '配置智能体界面的主题和显示偏好。',
  'Contrast': '对比度', 'Strong': '强', 'Preset': '预设', 'Default Light': '默认浅色', 'Default Dark': '默认深色',
  'Background': '背景', 'Foreground': '前景', 'Accent': '强调色', 'Advanced Settings': '高级设置',
  'Choose the experience that fits how you work.': '选择适合你工作方式的体验。', 'Choose between the Default and Project 4K experience.': '在默认体验和 Project 4K 体验之间选择。',

  // 设置页：Jetski Chat
  'Configure a chat bot so you can use Jetski directly from Google Chat.': '配置一个聊天机器人，直接在 Google Chat 里使用 Jetski。',
  'For help, visit': '如需帮助，请访问', 'or join the': '或加入', 'chat space': '聊天空间', 'Setup': '配置',
  'Bot Name': '机器人名称', 'Avatar URL': '头像网址', 'Setup Jetski Chat': '配置 Jetski Chat',
  'Enter bot name (optional)': '输入机器人名称（可选）', 'Enter avatar URL (optional)': '输入头像网址（可选）',

  // 设置页：通知
  'Show system notifications when your action is needed or the agent finishes.': '需要你操作或智能体完成时显示系统通知。',
  'Play a sound when your action is needed or the agent finishes.': '需要你操作或智能体完成时播放提示音。',
  'Volume': '音量', 'Notification Settings': '通知设置', 'Manage your notification preferences.': '管理通知偏好。',
  'Set the volume of agent sounds.': '设置智能体提示音的音量。', 'Browser Subagent': '浏览器子智能体',
  // 「2 projects」被拆成数字和单词两个节点时
  'projects': '个项目', 'project': '个项目',
  "To modify notification settings, open your operating system's system preferences.": '要修改通知设置，请打开操作系统的系统偏好设置。',
  'Open System Preferences': '打开系统偏好设置',

  // 设置页：自定义
  'Configure default behaviors, skills, and MCP servers.': '配置默认行为、技能和 MCP 服务器。',
  'The breakdown below shows token usage from customizations like rules, skills, and MCP. If a budget is exceeded, large rules are demoted to path pointers and large customizations are excluded automatically.': '下面列出规则、技能、MCP 等自定义项占用的 token。超出预算时，较大的规则会降级为路径引用，较大的自定义项会被自动排除。',
  'Other Customizations': '其他自定义', 'Global': '全局', 'Customize': '自定义',
  'Build With Google Plugins': 'Build With Google 插件', 'Browse and enable plugins from the Build With Google catalog.': '从 Build With Google 目录浏览并启用插件。',

  // 设置页：应用
  'Manage Antigravity app settings.': '管理 Antigravity 应用设置。',
  'Prevent the computer from sleeping while the app is running.': '应用运行时阻止电脑休眠。',
  'Keep the app accessible from the menu bar and running in the background when all windows are closed.': '关闭所有窗口后仍在菜单栏保留入口，并在后台运行。',
  'Work with local agents from another device.': '从其他设备使用本机的智能体。', 'Device Name': '设备名称', 'Enter device name...': '输入设备名称…',
  'Scan the code to open this device in Remote Control, or': '扫码在远程控制中打开此设备，或',
  'Version': '版本', 'App version': '应用版本',

  // 设置页：反馈
  'Feedback Type': '反馈类型', 'Bug Report': '问题报告', 'Feature Request': '功能建议', 'Auth and Billing': '认证与计费',
  'Remote Control Issue': '远程控制问题', 'General Feedback': '一般反馈', 'Description': '描述',
  'Please describe the issue in detail. The more actionable your feedback, the quicker our team can address your request. Some helpful information includes:': '请详细描述问题。反馈越具体，团队处理得越快。可以包括以下信息：',
  'Steps to reproduce the issue': '问题的复现步骤', 'Expected behavior': '预期行为', 'Actual behavior': '实际行为',
  'Any error messages': '错误信息', 'Any relevant information': '其他相关信息', 'Steps to Reproduce': '复现步骤',
  'Attach a screenshot (optional)': '附加截图（可选）', 'Attach Antigravity server logs': '附加 Antigravity 服务端日志',
  'Describe the bug you encountered...': '描述你遇到的问题…', 'Please list the steps to reproduce the issue': '请列出复现问题的步骤',
  'Submit': '提交', 'Visit': '访问', 'Legal Help': '法律帮助', 'to ask for content changes for legal reasons.': '，因法律原因申请修改内容。',

  // 设置页：快捷键
  'Keyboard shortcuts for quick navigation and control.': '用于快速导航和操作的键盘快捷键。',
  'Previous Aux Pane Tab': '上一个辅助面板标签', 'Next Aux Pane Tab': '下一个辅助面板标签', 'Find in Pane': '在面板中查找',
  'Add to Chat/Quote': '添加到对话/引用', 'Layout Controls': '布局控制', 'Search shortcuts...': '搜索快捷键…',

  // 设置页：模型与用量
  'Models & Usage': '模型与用量', 'Enable AI Credit Overages': '启用 AI 点数超额使用',
  "When toggled on, Antigravity will use your AI credits to fulfill model requests once you're out of model quota. Antigravity will always use your model quota first before using AI credits.": '开启后，模型配额用完时 Antigravity 会使用你的 AI 点数继续处理请求。Antigravity 总是先用模型配额，再用 AI 点数。',
  'Refresh quota and credits data': '刷新配额和点数', 'Gemini Models': 'Gemini 模型', 'Claude and GPT models': 'Claude 和 GPT 模型',
  'Weekly Limit Remaining': '本周剩余额度', 'Five Hour Limit Remaining': '5 小时剩余额度',

  // 设置页：开发者
  'Developer-only tools. These settings are stored locally in this browser and do not affect other users.': '仅供开发者使用的工具。这些设置只保存在本机，不影响其他用户。',
  'Regroup Google3 Chats': '重新分组 Google3 会话', 'Google3 chats will be regrouped into their workspaces in the sidebar.': 'Google3 会话会在侧栏中按工作区重新分组。',
  'This migration may mess up your settings, chats, and sidebar.': '这次迁移可能会打乱你的设置、会话和侧栏。',
  'Follow the guide at': '请按照', 'to back up your data and run the migration.': '中的指引备份数据并运行迁移。',
};

// 只在后一个兄弟节点是指定内容时才翻的词：单独出现时意思不同（例如 Type 在别处是「类型」）
module.exports.ctx = [
  ['Type', '/', '输入'],
];

// [正则源码, 替换]：$1 等引用捕获组；按顺序尝试，命中即停
module.exports.patterns = [
  ['^Select project, current: (.+)$', '选择项目，当前：$1'],
  ['^Select model, current: (.+)$', '选择模型，当前：$1'],
  ['^Agent permissions preset selector, current: (.+)$', '智能体权限预设，当前：$1'],
  ['^Conversation (\\d+)$', '会话 $1'],
  ['^(\\d+)s$', '$1 秒'], ['^(\\d+)m$', '$1 分钟'], ['^(\\d+)h$', '$1 小时'], ['^(\\d+)d$', '$1 天'], ['^(\\d+)w$', '$1 周'], ['^(\\d+)mo$', '$1 个月'], ['^(\\d+)y$', '$1 年'],
  ['^(\\d+) files? changed$', '$1 个文件有改动'],
  ['^(\\d+) projects?$', '$1 个项目'],
  ['^(\\d+) active conversations? and (\\d+) archived conversations?$', '$1 个进行中的会话和 $2 个已归档的会话'],
  ['^(\\d+) active conversations?$', '$1 个进行中的会话'],
  ['^(\\d+) archived conversations?$', '$1 个已归档的会话'],
  ['^Show (\\d+) breakdowns?$', '展开 $1 项明细'],
  ['^Rules: ([\\d,]+) tokens$', '规则：$1 tokens'],
  ['^Skills: ([\\d,]+) tokens$', '技能：$1 tokens'],
  ['^Mcp Tools: ([\\d,]+) tokens$', 'MCP 工具：$1 tokens'],
  ['^Send feedback as (.+)$', '以 $1 身份发送反馈'],
  // 时长里的 day / hour / minute 由 i18n.js 统一换成中文
  ['^You have used some of your weekly limit, it will fully refresh in (.+)\\.$', '本周额度已用掉一部分，将在 $1后完全恢复。'],
];
