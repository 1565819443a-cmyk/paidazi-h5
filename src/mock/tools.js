export const canteenData = [
  { id: 'c1', name: '竹园食堂', window: '麻辣香锅窗口', dish: '麻辣香锅套餐', price: 18, tags: ['麻辣', '川味'], queue: '中', rating: 4.5, distance: '近', image: '', reason: '校内最受欢迎窗口之一，荤素搭配丰富' },
  { id: 'c2', name: '海棠食堂', window: '盖浇饭窗口', dish: '宫保鸡丁盖浇饭', price: 14, tags: ['家常', '实惠'], queue: '少', rating: 4.3, distance: '中', image: '', reason: '经济实惠，分量大，适合日常午餐' },
  { id: 'c3', name: '丁香食堂', window: '兰州拉面窗口', dish: '牛肉拉面', price: 15, tags: ['面食', '西北风味'], queue: '多', rating: 4.6, distance: '中', image: '', reason: '汤鲜面劲道，高峰期排队约15分钟' },
  { id: 'c4', name: '竹园食堂', window: '黄焖鸡窗口', dish: '黄焖鸡米饭', price: 20, tags: ['鸡肉', '浓香'], queue: '中', rating: 4.4, distance: '近', image: '', reason: '鸡肉鲜嫩入味，配饭一流' },
  { id: 'c5', name: '综合楼食堂', window: '砂锅窗口', dish: '砂锅豆腐', price: 12, tags: ['素食', '清淡'], queue: '少', rating: 4.2, distance: '远', image: '', reason: '素食友好，冬天吃砂锅最暖' },
  { id: 'c6', name: '海棠食堂', window: '烧烤窗口', dish: '烤鸡腿饭', price: 22, tags: ['烧烤', '高蛋白'], queue: '多', rating: 4.7, distance: '中', image: '', reason: '现烤现卖，排队但值得等' },
  { id: 'c7', name: '竹园食堂', window: '煎饼果子窗口', dish: '煎饼果子', price: 8, tags: ['早餐', '小吃'], queue: '少', rating: 4.1, distance: '近', image: '', reason: '早餐首选，快速美味' },
  { id: 'c8', name: '丁香食堂', window: '自选快餐窗口', dish: '自选套餐', price: 16, tags: ['自选', '多样性'], queue: '中', rating: 4.0, distance: '中', image: '', reason: '十几道菜自选，荤素不限' },
];

export const latexTemplates = [
  { id: 'l1', name: '分式', code: '\\frac{a}{b}', desc: '分数表达式' },
  { id: 'l2', name: '上标下标', code: 'x^{2}_{i}', desc: '上下标组合' },
  { id: 'l3', name: '求和', code: '\\sum_{i=1}^{n} x_i', desc: '求和公式' },
  { id: 'l4', name: '积分', code: '\\int_{a}^{b} f(x)\\,dx', desc: '定积分' },
  { id: 'l5', name: '矩阵', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', desc: '2×2矩阵' },
  { id: 'l6', name: '方程组', code: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}', desc: '方程组' },
  { id: 'l7', name: 'IEEE公式编号', code: '\\begin{equation}\nE = mc^2\n\\label{eq:einstein}\n\\end{equation}', desc: '带编号的公式' },
  { id: 'l8', name: '图表引用', code: '\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.5\\textwidth]{fig.png}\n\\caption{图表标题}\n\\label{fig:example}\n\\end{figure}', desc: '插入并引用图片' },
  { id: 'l9', name: '参考文献', code: '\\bibliographystyle{IEEEtran}\n\\bibliography{references}', desc: 'IEEE格式参考文献' },
];

export const paperExpressions = [
  { en: 'Fig.', zh: '图', sample: 'As shown in Fig. 1' },
  { en: 'Table', zh: '表', sample: 'See Table II for details' },
  { en: 'Equation', zh: '公式', sample: 'According to Equation (3)' },
  { en: 'Algorithm', zh: '算法', sample: 'Algorithm 1 describes the process' },
  { en: 'IEEE Reference', zh: '参考文献', sample: '[1] Author, "Title," Journal, year' },
];

export const mathFunctions = [
  { name: 'y = x²', fn: (x) => x * x, xMin: -5, xMax: 5, desc: '二次函数，抛物线，关于y轴对称' },
  { name: 'y = sin(x)', fn: (x) => Math.sin(x), xMin: -Math.PI * 2, xMax: Math.PI * 2, desc: '正弦函数，周期为2π，振幅为1' },
  { name: 'y = cos(x)', fn: (x) => Math.cos(x), xMin: -Math.PI * 2, xMax: Math.PI * 2, desc: '余弦函数，周期为2π，是正弦函数的平移' },
  { name: 'y = eˣ', fn: (x) => Math.exp(x), xMin: -2, xMax: 3, desc: '指数函数，随x增大而快速增长' },
  { name: 'y = ln(x)', fn: (x) => Math.log(x), xMin: 0.1, xMax: 5, desc: '自然对数函数，x必须大于0' },
  { name: 'y = 1/x', fn: (x) => 1 / x, xMin: -5, xMax: -0.1, desc: '反比例函数，有两条渐近线' },
];

export const translationMock = {
  'zh2en': { input: '今天天气真好，适合出去走走。', output: "The weather is really nice today, perfect for going out for a walk." },
  'en2zh': { input: 'Artificial intelligence is changing the way we learn and work.', output: '人工智能正在改变我们学习和工作的方式。' },
  'academic': { input: '本文提出了一种基于深度学习的新型推荐算法。', output: 'This paper proposes a novel recommendation algorithm based on deep learning.' },
  'casual': { input: 'The food at this canteen is absolutely amazing!', output: '这个食堂的饭菜真的绝了！' },
};
