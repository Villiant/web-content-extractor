// 监听来自background.js的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractContent') {
    try {
      // 检查是否使用增强模式
      const useEnhancedMode = request.enhancedMode || false;
      
      if (useEnhancedMode) {
        console.log('使用增强模式提取内容');
        // 使用增强模式时，需要异步处理
        enhancedExtractPageContent()
          .then(content => {
            sendResponse({content: content, success: true});
          })
          .catch(error => {
            console.error('增强模式提取内容时发生错误:', error);
            sendResponse({
              content: null, 
              success: false, 
              error: `增强模式提取内容时发生错误: ${error.message}`
            });
          });
      } else {
        // 标准模式，同步处理
        const content = extractPageContent();
        sendResponse({content: content, success: true});
      }
    } catch (error) {
      console.error('提取内容时发生错误:', error);
      sendResponse({
        content: null, 
        success: false, 
        error: `提取内容时发生错误: ${error.message}`
      });
    }
    return true;
  }
});

// 增强模式提取页面内容（处理反抓取网站）
async function enhancedExtractPageContent() {
  try {
    console.log('开始增强模式内容提取...');
    
    // 1. 模拟用户行为
    await simulateUserBehavior();
    console.log('完成用户行为模拟');
    
    // 2. 模拟页面滚动以加载懒加载内容
    await simulateScroll();
    console.log('完成页面滚动模拟');
    
    // 3. 等待动态内容加载
    console.log('等待动态内容加载...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. 使用增强的内容提取方法
    console.log('使用增强算法提取内容');
    const enhancedContent = await extractEnhancedContent();
    
    // 获取页面标题和URL
    const title = document.title || '无标题';
    const url = window.location.href || '无URL';
    const date = new Date().toLocaleString();
    
    // 组合成最终内容
    const content = `标题：${title}\n` +
                    `URL：${url}\n` +
                    `抓取时间：${date}\n` +
                    `抓取模式：增强模式\n` +
                    `\n-------------------\n\n` +
                    `${enhancedContent}`;
    
    console.log('增强模式内容提取完成，总字符数:', content.length);
    return content;
  } catch (error) {
    console.error('增强模式提取失败:', error);
    throw new Error(`增强模式提取失败: ${error.message}`);
  }
}

// 模拟用户行为
function simulateUserBehavior() {
  return new Promise(resolve => {
    console.log('模拟用户行为...');
    
    // 创建并触发鼠标移动事件
    for (let i = 0; i < 5; i++) {
      const moveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight
      });
      document.dispatchEvent(moveEvent);
    }
    
    // 模拟随机点击（但不实际点击）
    const clickEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight
    });
    document.dispatchEvent(clickEvent);
    
    setTimeout(resolve, 500);
  });
}

// 模拟页面滚动
function simulateScroll() {
  return new Promise(resolve => {
    console.log('模拟页面滚动...');
    
    // 获取页面高度
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    // 分段滚动页面
    let currentPosition = 0;
    const scrollStep = Math.max(window.innerHeight, 200);
    const scrollInterval = setInterval(() => {
      window.scrollTo(0, currentPosition);
      currentPosition += scrollStep;
      
      if (currentPosition >= pageHeight) {
        clearInterval(scrollInterval);
        // 滚动回顶部
        window.scrollTo(0, 0);
        resolve();
      }
    }, 300);
  });
}

// 增强的内容提取方法
async function extractEnhancedContent() {
  try {
    // 存储所有可能的内容
    const contentCandidates = [];
    
    // 1. 尝试获取文章内容
    const articles = document.querySelectorAll('article');
    if (articles.length > 0) {
      console.log(`找到 ${articles.length} 个文章元素`);
      Array.from(articles).forEach(article => {
        contentCandidates.push({
          element: article,
          text: article.innerText,
          score: article.innerText.length * 2 // 文章元素得分加倍
        });
      });
    }
    
    // 2. 尝试获取主要内容区域
    const mainElements = document.querySelectorAll('main, #main, .main');
    if (mainElements.length > 0) {
      console.log(`找到 ${mainElements.length} 个主要内容区域`);
      Array.from(mainElements).forEach(main => {
        contentCandidates.push({
          element: main,
          text: main.innerText,
          score: main.innerText.length * 1.5 // main元素得分乘以1.5
        });
      });
    }
    
    // 3. 尝试获取内容区域
    const contentElements = document.querySelectorAll('#content, .content, .article, .post, .entry, .entry-content');
    if (contentElements.length > 0) {
      console.log(`找到 ${contentElements.length} 个内容区域`);
      Array.from(contentElements).forEach(content => {
        contentCandidates.push({
          element: content,
          text: content.innerText,
          score: content.innerText.length * 1.2 // 内容元素得分乘以1.2
        });
      });
    }
    
    // 4. 查找最长的段落集合
    const paragraphs = document.querySelectorAll('p');
    if (paragraphs.length > 5) { // 至少需要5个段落
      console.log(`找到 ${paragraphs.length} 个段落，分析段落密集区域`);
      // 查找段落密集的区域
      const parents = {};
      Array.from(paragraphs).forEach(p => {
        if (p.innerText.length < 20) return; // 忽略短段落
        
        const parent = p.parentElement;
        if (!parents[parent]) {
          parents[parent] = {
            element: parent,
            paragraphCount: 1,
            textLength: p.innerText.length
          };
        } else {
          parents[parent].paragraphCount++;
          parents[parent].textLength += p.innerText.length;
        }
      });
      
      // 将段落密集区域添加到候选列表
      Object.values(parents).forEach(parent => {
        if (parent.paragraphCount >= 3) { // 至少包含3个段落
          contentCandidates.push({
            element: parent.element,
            text: parent.element.innerText,
            score: parent.textLength * (parent.paragraphCount / 10 + 1) // 根据段落数量和文本长度计算得分
          });
        }
      });
    }
    
    // 5. 尝试处理隐藏内容
    const hiddenElements = document.querySelectorAll('[style*="display:none"], [style*="display: none"], [hidden]');
    if (hiddenElements.length > 0) {
      console.log(`检测到 ${hiddenElements.length} 个隐藏元素，尝试分析`);
      
      // 临时显示隐藏元素
      const originalStyles = [];
      Array.from(hiddenElements).forEach(el => {
        // 只处理可能包含有用内容的元素
        if (el.tagName.toLowerCase() === 'div' || 
            el.tagName.toLowerCase() === 'section' || 
            el.tagName.toLowerCase() === 'article') {
          originalStyles.push({
            element: el,
            display: el.style.display,
            visibility: el.style.visibility,
            hidden: el.hidden
          });
          
          // 临时显示
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.hidden = false;
        }
      });
      
      // 等待可能的动态内容加载
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 检查这些元素是否包含有用内容
      originalStyles.forEach(item => {
        const text = item.element.innerText;
        if (text && text.length > 200) { // 只考虑有足够内容的元素
          contentCandidates.push({
            element: item.element,
            text: text,
            score: text.length * 0.8 // 隐藏元素得分较低
          });
        }
        
        // 恢复原始状态
        item.element.style.display = item.display;
        item.element.style.visibility = item.visibility;
        item.element.hidden = item.hidden;
      });
    }
    
    // 6. 如果以上都失败，获取body内容并过滤掉导航、页脚等
    if (contentCandidates.length === 0) {
      console.log('未找到明确的内容区域，尝试过滤整个页面');
      const body = document.body;
      
      // 移除不需要的元素
      const elementsToRemove = [
        'header', 'nav', 'aside', 'footer', 'menu', 'menubar', 'advertisement',
        '.header', '.nav', '.menu', '.sidebar', '.footer', '.ad', '.ads', '.advertisement',
        '#header', '#nav', '#menu', '#sidebar', '#footer', '#ad', '#ads', '#advertisement'
      ];
      
      // 创建body的克隆以避免修改原始DOM
      const clone = body.cloneNode(true);
      
      // 移除不需要的元素
      elementsToRemove.forEach(selector => {
        const elements = clone.querySelectorAll(selector);
        console.log(`移除 ${selector} 元素: ${elements.length}个`);
        elements.forEach(el => el.remove());
      });
      
      contentCandidates.push({
        element: clone,
        text: clone.innerText,
        score: clone.innerText.length * 0.5 // body得分较低
      });
    }
    
    // 根据得分排序候选内容
    contentCandidates.sort((a, b) => b.score - a.score);
    
    // 返回得分最高的内容
    if (contentCandidates.length > 0) {
      const bestContent = contentCandidates[0].text;
      console.log(`选择最佳内容，得分: ${contentCandidates[0].score}, 长度: ${bestContent.length}`);
      return cleanExtractedText(bestContent);
    }
    
    // 如果没有找到任何内容，返回整个页面的文本
    console.warn('未找到合适的内容，返回整个页面文本');
    return cleanExtractedText(document.body.innerText);
  } catch (error) {
    console.error('增强内容提取时发生错误:', error);
    return `增强内容提取时发生错误: ${error.message}`;
  }
}

// 清理提取的文本
function cleanExtractedText(text) {
  if (!text) return '';
  
  // 移除不可见字符
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // 替换特殊空格
  text = text.replace(/\s+/g, ' ');
  
  // 移除多余的换行
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // 移除重复的空格
  text = text.replace(/ {2,}/g, ' ');
  
  return text.trim();
}

// 提取页面内容的函数（标准模式）
function extractPageContent() {
  // 使用简化版的内容提取逻辑
  function getMainContent() {
    try {
      // 尝试获取文章内容
      const article = document.querySelector('article');
      if (article) {
        console.log('找到文章元素');
        return article.innerText;
      }
      
      // 尝试获取主要内容区域
      const main = document.querySelector('main');
      if (main) {
        console.log('找到主要内容区域');
        return main.innerText;
      }
      
      // 尝试获取内容区域
      const content = document.querySelector('#content, .content, .article, .post');
      if (content) {
        console.log('找到内容区域');
        return content.innerText;
      }
      
      console.log('未找到明确的内容区域，尝试过滤整个页面');
      
      // 如果以上都失败，获取body内容并过滤掉导航、页脚等
      const body = document.body;
      if (!body) {
        throw new Error('无法获取页面body元素');
      }
      
      // 移除不需要的元素
      const elementsToRemove = [
        'header', 'nav', 'aside', 'footer', 
        '.header', '.nav', '.menu', '.sidebar', '.footer',
        '#header', '#nav', '#menu', '#sidebar', '#footer'
      ];
      
      // 创建body的克隆以避免修改原始DOM
      const clone = body.cloneNode(true);
      
      // 移除不需要的元素
      elementsToRemove.forEach(selector => {
        const elements = clone.querySelectorAll(selector);
        console.log(`移除 ${selector} 元素: ${elements.length}个`);
        elements.forEach(el => el.remove());
      });
      
      const extractedText = clone.innerText;
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn('提取的内容为空');
      }
      
      return extractedText;
    } catch (error) {
      console.error('提取主要内容时发生错误:', error);
      return `提取主要内容时发生错误: ${error.message}`;
    }
  }
  
  try {
    // 检查页面是否已加载完成
    if (document.readyState !== 'complete') {
      console.warn('页面尚未完全加载，内容可能不完整');
    }
    
    // 获取页面标题和URL
    const title = document.title || '无标题';
    const url = window.location.href || '无URL';
    const date = new Date().toLocaleString();
    
    // 获取主要内容
    console.log('开始提取页面主要内容');
    const mainContent = getMainContent();
    
    if (!mainContent || mainContent.trim().length === 0) {
      console.warn('提取的主要内容为空');
    }
    
    // 组合成最终内容
    const content = `标题：${title}\n` +
                    `URL：${url}\n` +
                    `抓取时间：${date}\n` +
                    `抓取模式：标准模式\n` +
                    `\n-------------------\n\n` +
                    `${mainContent}`;
    
    console.log('内容提取完成，总字符数:', content.length);
    return content;
  } catch (error) {
    console.error('提取页面内容时发生错误:', error);
    throw new Error(`提取页面内容失败: ${error.message}`);
  }
} 