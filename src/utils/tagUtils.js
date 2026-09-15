export const ALL_TAGS = {
  study: ['学习', '考研', '四六级', '高数', '图书馆', '论文写作', 'LaTeX', '英语'],
  contest: ['竞赛', '数学建模', '大模型应用', '电子设计', '商业计划书', '创新创业', 'ACM', 'CTF'],
  career: ['就业', '秋招', '实习', '简历', '面试', '公务员', '选调生'],
  skill: ['Python', 'React', 'Vue', 'C++', 'Java', 'PPT', 'Excel', 'MATLAB', 'SQL', 'Figma'],
  life: ['美食', '食堂', '运动', '健身', '游戏', '电影', '摄影', '旅行'],
  personality: ['早起鸟', '夜猫子', '学霸', '开朗', '随和', '严谨', '创意'],
};

export function getAllTagsFlat() {
  return Object.values(ALL_TAGS).flat();
}

export function getTagsByCategory() {
  return ALL_TAGS;
}
