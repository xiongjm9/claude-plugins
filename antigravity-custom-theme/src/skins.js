// 皮肤只定义底色、文字、发丝和默认强调色；结构样式全在 base.css，玻璃与壁纸在 studio.css。
// 配色原则：中性低饱和，一个强调色只用在主按钮、焦点环、选中细条；正文 ≥ 12:1、次级 ≥ 4.5:1。
module.exports.SKINS = [
  {
    id: 'aluminum', name: '铝灰', en: 'Aluminum', wall: 'aurora',
    tokens: { base: '#F5F5F7', base2: '#F7F7F9', sidebar: '#FBFBFD', text: '#1D1D1F', text2: '#6E6E73', line: '#E3E3E8', accent: '#0071E3' },
  },
  {
    id: 'porcelain', name: '瓷白', en: 'Porcelain', wall: 'mono',
    tokens: { base: '#FAFAFA', base2: '#FCFCFC', sidebar: '#FFFFFF', text: '#171717', text2: '#666666', line: '#EBEBEB', accent: '#171717' },
  },
  {
    id: 'fog', name: '雾蓝', en: 'Fog', wall: 'bay',
    tokens: { base: '#F2F5F9', base2: '#F5F7FB', sidebar: '#FAFBFD', text: '#16202E', text2: '#5B6778', line: '#DEE4EC', accent: '#3157D5' },
  },
  {
    id: 'sand', name: '沙岩', en: 'Sandstone', wall: 'dune',
    tokens: { base: '#F6F4F0', base2: '#F8F6F3', sidebar: '#FCFBF9', text: '#252321', text2: '#6B665F', line: '#E6E1D9', accent: '#A4492A' },
  },
  {
    id: 'sage', name: '苔绿', en: 'Sage', wall: 'aurora',
    tokens: { base: '#F3F6F4', base2: '#F6F8F6', sidebar: '#FBFCFB', text: '#18231E', text2: '#5A6962', line: '#DBE3DE', accent: '#2B7556' },
  },
];

// 强调色：全部能让白字达到 4.5:1，可直接当主按钮底色
module.exports.ACCENTS = [
  { hex: '#0071E3', name: '蓝' },
  { hex: '#5856D6', name: '靛' },
  { hex: '#8944C8', name: '紫' },
  { hex: '#C8336A', name: '莓' },
  { hex: '#D0342C', name: '红' },
  { hex: '#B5520B', name: '橙' },
  { hex: '#8A6100', name: '琥珀' },
  { hex: '#1F7F48', name: '绿' },
  { hex: '#0B7480', name: '青' },
  { hex: '#3A3A3C', name: '石墨' },
];

// 渐变壁纸：浅色、柔和、低对比，铺在内容后面不抢字
module.exports.GRADIENTS = [
  { id: 'dawn', name: '晨曦', css: 'radial-gradient(120% 90% at 0% 0%, #FDE2D6 0%, transparent 55%), radial-gradient(90% 80% at 100% 10%, #E4DDFB 0%, transparent 60%), radial-gradient(100% 90% at 60% 100%, #FBEFE3 0%, transparent 60%), #F7F3F1' },
  { id: 'bay', name: '海湾', css: 'radial-gradient(110% 90% at 10% 0%, #D3E6FB 0%, transparent 58%), radial-gradient(90% 90% at 100% 30%, #D2F1EC 0%, transparent 60%), radial-gradient(100% 80% at 40% 100%, #E7EEFA 0%, transparent 60%), #F1F5F9' },
  { id: 'aurora', name: '极光', css: 'radial-gradient(90% 80% at 0% 20%, #D5F3E6 0%, transparent 58%), radial-gradient(90% 90% at 70% 0%, #DCE3FD 0%, transparent 58%), radial-gradient(100% 90% at 100% 100%, #EBDDFA 0%, transparent 60%), #F3F5F8' },
  { id: 'dune', name: '沙丘', css: 'radial-gradient(120% 90% at 100% 0%, #F6E5CF 0%, transparent 58%), radial-gradient(100% 90% at 0% 100%, #EFE4DA 0%, transparent 60%), #F7F4EF' },
  { id: 'mono', name: '素灰', css: 'radial-gradient(120% 100% at 50% 0%, #FFFFFF 0%, transparent 60%), linear-gradient(180deg, #F2F2F4 0%, #E9E9EC 100%)' },
];
