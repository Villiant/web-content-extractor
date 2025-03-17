// 当弹出窗口加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  const savePathInput = document.getElementById('savePath');
  const captureBtn = document.getElementById('captureBtn');
  const savePathBtn = document.getElementById('savePathBtn');
  const statusDiv = document.getElementById('status');
  
  // 添加增强模式选项
  const enhancedModeDiv = document.createElement('div');
  enhancedModeDiv.className = 'form-group';
  enhancedModeDiv.innerHTML = `
    <label class="checkbox-container">
      <input type="checkbox" id="enhancedMode">
      <span class="checkmark"></span>
      启用增强模式（用于反抓取网站）
    </label>
    <div class="enhanced-hint">针对有反抓取措施的网站，会使用更强大的内容提取方法，但可能需要更长时间</div>
  `;
  
  // 将增强模式选项添加到容器中
  const containerElement = document.querySelector('.container');
  const buttonGroup = document.querySelector('.button-group');
  
  if (containerElement && buttonGroup) {
    // 在按钮组之前插入增强模式选项
    containerElement.insertBefore(enhancedModeDiv, buttonGroup);
  } else {
    console.error('无法找到容器元素或按钮组元素');
  }
  
  // 添加路径提示信息
  const pathHint = document.createElement('div');
  pathHint.className = 'path-hint';
  pathHint.innerHTML = '<strong>注意</strong>: 由于Chrome安全限制，文件实际会保存到默认下载文件夹。此设置仅用于组织文件。';
  
  // 将提示添加到保存路径输入框后面
  const formGroup = savePathInput.parentElement;
  if (formGroup) {
    formGroup.appendChild(pathHint);
  } else {
    console.error('无法找到保存路径输入框的父元素');
  }
  
  // 监听来自background.js的消息
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveContentResult') {
      const response = request.result;
      if (response && response.success) {
        showStatus('内容已保存到：' + response.filePath);
      } else {
        const errorMsg = response ? response.error : '未知错误';
        showStatus('保存失败：' + errorMsg, true);
        console.error('保存失败：', errorMsg);
      }
    }
  });
  
  // 从存储中加载保存路径和增强模式设置
  chrome.storage.sync.get(['savePath', 'enhancedMode'], function(data) {
    if (data.savePath) {
      savePathInput.value = data.savePath;
    } else {
      // 默认使用"downloads"作为保存路径
      savePathInput.value = "downloads";
      chrome.storage.sync.set({ 'savePath': "downloads" });
    }
    
    // 设置增强模式复选框状态
    const enhancedModeCheckbox = document.getElementById('enhancedMode');
    if (enhancedModeCheckbox && data.enhancedMode) {
      enhancedModeCheckbox.checked = data.enhancedMode;
    }
  });
  
  // 保存增强模式设置
  const enhancedModeCheckbox = document.getElementById('enhancedMode');
  if (enhancedModeCheckbox) {
    enhancedModeCheckbox.addEventListener('change', function() {
      const enhancedMode = this.checked;
      chrome.storage.sync.set({ 'enhancedMode': enhancedMode }, function() {
        if (chrome.runtime.lastError) {
          console.error('保存增强模式设置失败：', chrome.runtime.lastError);
        } else {
          showStatus(enhancedMode ? '已启用增强模式' : '已禁用增强模式');
        }
      });
    });
  } else {
    console.error('无法找到增强模式复选框元素');
  }
  
  // 保存路径按钮点击事件
  savePathBtn.addEventListener('click', function() {
    const newPath = savePathInput.value.trim();
    if (newPath) {
      // 验证路径格式
      if (!isValidPath(newPath)) {
        showStatus('路径格式无效！请使用简单的文件夹名称，如：downloads 或 my_documents', true);
        return;
      }
      
      chrome.storage.sync.set({ 'savePath': newPath }, function() {
        if (chrome.runtime.lastError) {
          showStatus('保存路径失败：' + chrome.runtime.lastError.message, true);
          console.error('保存路径失败：', chrome.runtime.lastError);
        } else {
          showStatus('保存路径已更新！文件将保存到下载文件夹中的 ' + newPath + ' 子文件夹');
        }
      });
    } else {
      showStatus('请输入有效的保存路径！', true);
    }
  });
  
  // 抓取内容按钮点击事件
  captureBtn.addEventListener('click', function() {
    captureContent();
  });
  
  // 抓取内容的函数
  function captureContent() {
    const savePath = savePathInput.value.trim();
    if (!savePath) {
      showStatus('请先设置保存路径！', true);
      return;
    }
    
    // 验证路径格式
    if (!isValidPath(savePath)) {
      showStatus('路径格式无效！请使用简单的文件夹名称，如：downloads 或 my_documents', true);
      return;
    }
    
    // 获取增强模式设置
    const enhancedMode = document.getElementById('enhancedMode')?.checked || false;
    
    showStatus('正在抓取内容...');
    
    // 向当前标签页注入脚本，抓取内容
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || tabs.length === 0) {
        showStatus('无法获取当前标签页信息', true);
        console.error('无法获取当前标签页');
        return;
      }
      
      const activeTab = tabs[0];
      
      // 检查URL是否有效
      if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://')) {
        showStatus('无法在此页面抓取内容（浏览器内部页面）', true);
        return;
      }
      
      try {
        // 首先注入content.js脚本（如果尚未注入）
        chrome.scripting.executeScript({
          target: {tabId: activeTab.id},
          files: ['content.js']
        }, function() {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || '未知错误';
            showStatus('注入脚本失败：' + errorMsg, true);
            console.error('注入content.js失败:', chrome.runtime.lastError);
            return;
          }
          
          // 然后向content.js发送消息，请求提取内容
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'extractContent',
            enhancedMode: enhancedMode
          }, function(response) {
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message || '未知错误';
              showStatus('与内容脚本通信失败：' + errorMsg, true);
              console.error('与content.js通信失败:', chrome.runtime.lastError);
              return;
            }
            
            if (!response) {
              showStatus('未收到内容脚本响应', true);
              console.error('未收到content.js响应');
              return;
            }
            
            if (response.success) {
              const content = response.content;
              
              // 获取当前页面标题作为文件名
              const pageTitle = activeTab.title || '未命名页面';
              const fileName = sanitizeFileName(pageTitle) + '.txt';
              
              // 发送消息给background.js保存文件
              try {
                chrome.runtime.sendMessage({
                  action: 'saveContent',
                  content: content,
                  fileName: fileName,
                  savePath: savePath
                }, function(response) {
                  // 这里只接收初始响应，实际结果会通过另一个消息事件接收
                  if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message || '未知错误';
                    showStatus('与后台通信失败：' + errorMsg, true);
                    console.error('与后台通信失败：', errorMsg);
                  } else if (response && response.status === 'processing') {
                    showStatus('正在处理保存请求...');
                  }
                });
              } catch (error) {
                showStatus('发送保存请求失败：' + error.message, true);
                console.error('发送保存请求失败：', error);
              }
            } else {
              const errorMsg = response.error || '未知错误';
              showStatus('抓取失败：' + errorMsg, true);
              console.error('抓取失败：', errorMsg);
            }
          });
        });
      } catch (error) {
        showStatus('执行脚本错误：' + error.message, true);
        console.error('执行脚本错误：', error);
      }
    });
  }
  
  // 显示状态信息
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? '#e53935' : '#4CAF50';
    
    // 如果是错误信息，增加显示时间
    const timeout = isError ? 10000 : 5000;
    
    // 5秒或10秒后清除状态
    setTimeout(() => {
      if (statusDiv.textContent === message) {
        statusDiv.textContent = '';
      }
    }, timeout);
    
    // 如果是错误信息，同时在控制台输出
    if (isError) {
      console.error(message);
    }
  }
  
  // 验证路径格式
  function isValidPath(path) {
    // 简化路径验证，只允许简单的文件夹名称
    // 避免使用完整路径，因为Chrome下载API有限制
    const simplePathPattern = /^[a-zA-Z0-9_\-\.]+$/;
    
    // 允许简单的子文件夹结构
    const subfolderPattern = /^[a-zA-Z0-9_\-\.\/\\]+$/;
    
    return simplePathPattern.test(path) || subfolderPattern.test(path);
  }
  
  // 清理文件名（移除不允许的字符）
  function sanitizeFileName(name) {
    if (!name) return '未命名文件';
    
    // 移除不允许的字符
    name = name.replace(/[\\/:*?"<>|]/g, '_');
    
    // 限制长度
    if (name.length > 100) {
      name = name.substring(0, 100);
    }
    
    return name;
  }
}); 