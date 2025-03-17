// 监听来自popup.js的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'saveContent') {
    // 立即返回一个初始响应，保持通信端口开启
    sendResponse({status: 'processing'});
    
    // 然后异步处理保存操作
    saveContentToFile(request.content, request.fileName, request.savePath, function(response) {
      // 使用chrome.runtime.sendMessage向popup发送结果
      if (chrome.runtime.lastError) {
        console.error('发送结果时出错:', chrome.runtime.lastError);
      } else {
        try {
          // 尝试向发送方发送消息
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0) {
              chrome.runtime.sendMessage({
                action: 'saveContentResult',
                result: response
              }).catch(function(error) {
                console.error('发送结果消息失败:', error);
              });
            }
          });
        } catch (error) {
          console.error('发送结果时出错:', error);
        }
      }
    });
    
    // 返回true表示将异步发送响应
    return true;
  }
});

// 监听快捷键
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'capture-content') {
    captureContentWithShortcut();
  }
});

// 使用快捷键抓取内容
function captureContentWithShortcut() {
  // 获取保存路径和增强模式设置
  chrome.storage.sync.get(['savePath', 'enhancedMode'], function(data) {
    const savePath = data.savePath || 'downloads';
    const enhancedMode = data.enhancedMode || false;
    
    // 获取当前活动标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      // 检查URL是否有效
      if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://')) {
        showNotification('抓取失败', '无法在此页面抓取内容（浏览器内部页面）');
        return;
      }
      
      // 首先注入content.js脚本（如果尚未注入）
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        files: ['content.js']
      }, function() {
        if (chrome.runtime.lastError) {
          console.error('注入content.js失败:', chrome.runtime.lastError);
          showNotification('抓取失败', '无法注入内容抓取脚本');
          return;
        }
        
        // 然后向content.js发送消息，请求提取内容
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'extractContent',
          enhancedMode: enhancedMode
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('与content.js通信失败:', chrome.runtime.lastError);
            showNotification('抓取失败', '与内容脚本通信失败');
            return;
          }
          
          if (response && response.success) {
            const content = response.content;
            
            // 获取当前页面标题作为文件名
            const pageTitle = activeTab.title || '未命名页面';
            const fileName = sanitizeFileName(pageTitle) + '.txt';
            
            // 保存内容到文件
            saveContentToFile(content, fileName, savePath, function(response) {
              // 快捷键模式下只显示通知
              if (response.success) {
                showNotification('保存成功', `内容已保存到: ${response.filePath}`);
              } else {
                showNotification('保存失败', response.error);
              }
            });
          } else {
            const errorMsg = response ? response.error : '未知错误';
            showNotification('抓取失败', `无法提取页面内容: ${errorMsg}`);
            console.error('抓取结果错误:', errorMsg);
          }
        });
      });
    });
  });
}

// 提取页面内容的函数（在页面上下文中执行）
// 注意：此函数已不再使用，内容提取逻辑已移至content.js
function extractPageContent(enhancedMode) {
  // 通知content.js提取内容
  return new Promise((resolve, reject) => {
    try {
      // 发送消息给content.js
      chrome.runtime.sendMessage({
        action: 'extractContent',
        enhancedMode: enhancedMode
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('与content.js通信失败:', chrome.runtime.lastError);
          reject(`与content.js通信失败: ${chrome.runtime.lastError.message}`);
        } else if (response && response.success) {
          resolve(response.content);
        } else {
          const errorMsg = response ? response.error : '未知错误';
          console.error('content.js提取内容失败:', errorMsg);
          reject(`提取内容失败: ${errorMsg}`);
        }
      });
    } catch (error) {
      console.error('调用content.js时出错:', error);
      reject(`调用content.js时出错: ${error.message}`);
    }
  });
}

// 保存内容到文件
function saveContentToFile(content, fileName, savePath, callback) {
  try {
    // 使用Chrome下载API保存文件
    // 注意：Chrome扩展无法直接写入本地文件系统，只能通过下载API
    
    // 在Service Worker环境中，URL.createObjectURL不可用
    // 使用Data URL代替
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:text/plain;base64,${base64Content}`;
    
    // 清理和验证文件名
    fileName = sanitizeFileName(fileName);
    
    // 构建下载选项
    const downloadOptions = {
      url: dataUrl,
      saveAs: false
    };
    
    // 尝试使用用户指定的路径（如果提供）
    if (savePath && savePath.trim()) {
      // 清理路径，确保格式正确
      savePath = cleanPath(savePath);
      
      // 记录原始路径和清理后的路径
      console.log('原始保存路径:', savePath);
      
      // 尝试构建完整的文件路径
      // 注意：由于Chrome安全限制，可能只能保存到下载文件夹
      try {
        // 只使用文件名，不指定完整路径
        // 这样Chrome会使用默认下载位置
        downloadOptions.filename = fileName;
        
        console.log('使用默认下载位置，文件名:', fileName);
      } catch (pathError) {
        console.error('路径处理错误:', pathError);
        // 如果路径处理出错，只使用文件名
        downloadOptions.filename = fileName;
      }
    } else {
      // 如果没有提供路径，只使用文件名
      downloadOptions.filename = fileName;
      console.log('未提供保存路径，使用默认下载位置，文件名:', fileName);
    }
    
    console.log('最终下载选项:', JSON.stringify(downloadOptions));
    
    // 执行下载
    chrome.downloads.download(downloadOptions, function(downloadId) {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message || '未知错误';
        console.error('下载API错误:', error);
        
        // 检查常见错误原因
        let detailedError = error;
        if (error.includes('Invalid filename')) {
          detailedError = `文件名或路径无效: "${downloadOptions.filename}"。Chrome扩展只能保存到下载文件夹，请确保文件名不包含特殊字符。`;
          
          // 尝试只用文件名再次下载
          console.log('尝试使用纯文件名再次下载');
          chrome.downloads.download({
            url: dataUrl,
            filename: fileName,
            saveAs: false
          }, function(retryDownloadId) {
            if (chrome.runtime.lastError) {
              const retryError = chrome.runtime.lastError.message;
              console.error('重试下载失败:', retryError);
              showNotification('保存失败', `重试下载也失败: ${retryError}`);
              if (callback) {
                callback({success: false, error: `重试下载也失败: ${retryError}`});
              }
            } else if (retryDownloadId) {
              // 监听重试下载的完成事件
              const retryListener = function(delta) {
                if (delta.id === retryDownloadId && delta.state) {
                  if (delta.state.current === 'complete') {
                    showNotification('保存成功', `内容已保存到下载文件夹: ${fileName}`);
                    if (callback) {
                      callback({success: true, filePath: fileName});
                    }
                    chrome.downloads.onChanged.removeListener(retryListener);
                  } else if (delta.state.current === 'interrupted') {
                    handleDownloadInterruption(retryDownloadId, callback);
                    chrome.downloads.onChanged.removeListener(retryListener);
                  }
                }
              };
              chrome.downloads.onChanged.addListener(retryListener);
            }
          });
          return;
        } else if (error.includes('permission')) {
          detailedError = `没有权限保存文件。Chrome扩展只能保存到下载文件夹。`;
        } else if (error.includes('not allowed')) {
          detailedError = `浏览器不允许保存到指定位置。Chrome扩展只能保存到下载文件夹。`;
        }
        
        showNotification('保存失败', detailedError);
        if (callback) {
          callback({success: false, error: detailedError});
        }
      } else if (downloadId === undefined) {
        // 下载ID未定义也表示失败
        const errorMsg = '下载初始化失败，可能是路径无效或没有权限';
        console.error(errorMsg);
        showNotification('保存失败', errorMsg);
        if (callback) {
          callback({success: false, error: errorMsg});
        }
      } else {
        // 监听下载完成事件
        const downloadListener = function(delta) {
          if (delta.id === downloadId && delta.state) {
            if (delta.state.current === 'complete') {
              const successMsg = `内容已保存: ${downloadOptions.filename}`;
              showNotification('保存成功', successMsg);
              if (callback) {
                callback({success: true, filePath: downloadOptions.filename});
              }
              chrome.downloads.onChanged.removeListener(downloadListener);
            } else if (delta.state.current === 'interrupted') {
              handleDownloadInterruption(downloadId, callback);
              chrome.downloads.onChanged.removeListener(downloadListener);
            }
          }
        };
        
        chrome.downloads.onChanged.addListener(downloadListener);
      }
    });
  } catch (error) {
    const errorMsg = `保存文件时发生异常: ${error.message}`;
    console.error(errorMsg, error);
    showNotification('保存失败', errorMsg);
    if (callback) {
      callback({success: false, error: errorMsg});
    }
  }
}

// 处理下载中断
function handleDownloadInterruption(downloadId, callback) {
  chrome.downloads.search({id: downloadId}, function(downloads) {
    let errorMsg = '下载被中断';
    if (downloads && downloads[0] && downloads[0].error) {
      errorMsg = `下载错误: ${downloads[0].error}`;
      
      // 提供更友好的错误信息
      if (downloads[0].error === 'FILE_FAILED') {
        errorMsg = `文件写入失败，可能是路径不存在或没有写入权限`;
      } else if (downloads[0].error === 'FILE_ACCESS_DENIED') {
        errorMsg = `访问被拒绝，没有权限写入指定位置`;
      } else if (downloads[0].error === 'FILE_NO_SPACE') {
        errorMsg = '磁盘空间不足';
      } else if (downloads[0].error === 'FILE_NAME_TOO_LONG') {
        errorMsg = '文件名过长';
      }
    }
    console.error(errorMsg);
    showNotification('保存失败', errorMsg);
    if (callback) {
      callback({success: false, error: errorMsg});
    }
  });
}

// 清理路径，确保格式正确
function cleanPath(path) {
  // 移除路径中的多余斜杠和空格
  path = path.trim().replace(/\/+/g, '/').replace(/\\+/g, '\\');
  
  // 确保路径不以斜杠结尾
  if (path.endsWith('/') || path.endsWith('\\')) {
    path = path.slice(0, -1);
  }
  
  return path;
}

// 清理文件名（移除不允许的字符）
function sanitizeFileName(name) {
  if (!name) return '未命名文件.txt';
  
  // 移除不允许的字符
  name = name.replace(/[\\/:*?"<>|]/g, '_');
  
  // 限制长度
  if (name.length > 100) {
    name = name.substring(0, 100);
  }
  
  // 确保有.txt扩展名
  if (!name.toLowerCase().endsWith('.txt')) {
    name += '.txt';
  }
  
  return name;
}

// 显示通知
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: title,
    message: message
  });
} 