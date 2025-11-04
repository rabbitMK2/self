import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// 模块元素类型定义
export interface ModuleElement {
  id: string;
  type: 'text' | 'image' | 'link' | 'card' | 'other';
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  title?: string;
  description?: string;
  additionalProps?: Record<string, any>;
}

// 弹窗属性定义
interface ModuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  elements: ModuleElement[];
  onUpdateElements: (elements: ModuleElement[]) => void;
  moduleType?: string;
  supportsAddDelete?: boolean;
  onlyModify?: boolean;
}

const ModuleEditorModal: React.FC<ModuleEditorModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  elements,
  onUpdateElements,
  moduleType = 'general',
  supportsAddDelete = false,
  onlyModify = false
}) => {
  const [localElements, setLocalElements] = useState<ModuleElement[]>(elements);

   // 当外部elements变化时更新本地状态
  useEffect(() => {
    // 确保elements是有效的数组
    if (Array.isArray(elements) && elements.length > 0) {
      setLocalElements(elements);
    }
  }, [elements]);

  // 处理输入变化
  const handleInputChange = (id: string, field: keyof ModuleElement, value: string | boolean | number) => {
    setLocalElements(prevElements =>
      prevElements.map(element =>
        element.id === id ? { ...element, [field]: value } : element
      )
    );
  };

  // 处理文件上传
  const handleFileUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(id, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 添加新元素
  const addElement = () => {
    let newElement: ModuleElement;
    
    // 根据模块类型创建不同的新元素
    switch (moduleType) {
      case 'timeline':
        const currentYear = new Date().getFullYear();
        newElement = {
          id: `timeline-${currentYear}`,
          type: 'card',
          title: '新的历程事件',
          description: '请输入事件描述',
          imageUrl: '',
          additionalProps: { 
            type: 'timeline',
            year: currentYear
          }
        };
        break;
      
       case 'qa':
         newElement = {
           id: `qa-${Date.now()}`,
           type: 'card',
           title: '新问题',
           description: '新回答',
           additionalProps: { type: 'qa' }
         };
         break;
       
       case 'competition':
         newElement = {
           id: `competition-${Date.now()}`,
           type: 'card',
           title: '新赛事',
           description: '请输入赛事描述',
           additionalProps: { 
             type: 'competition',
             date: '每年XX月'
           }
         };
         break;
      
      case 'honor':
        newElement = {
          id: `honor-${Date.now()}`,
          type: 'card',
          title: '新荣誉',
          description: currentYear.toString(),
          imageUrl: '',
          additionalProps: { type: 'honor' }
        };
        break;
      
      case 'carousel':
        newElement = {
          id: `carousel-${Date.now()}`,
          type: 'card',
          title: '新轮播图标题',
          description: '新轮播图描述',
          imageUrl: '',
          linkUrl: '',
          additionalProps: { type: 'carousel' }
        };
        break;
      
      case 'mentor':
        newElement = {
          id: `mentor-${Date.now()}`,
          type: 'card',
          name: '新导师', // 导师名字
          title: '导师职位', // 导师职位
          handle: '内蒙古科技大学',
          status: '研究方向',
          contactText: '详细信息',
          imageUrl: '',
          description: '导师简介',
          additionalProps: {
            showBehindGradient: true,
            enableTilt: true,
            showUserInfo: true
          }
        };
        break;
      
      default:
        newElement = {
          id: `element-${Date.now()}`,
          type: 'text',
          content: '新内容',
        };
    }
    
    setLocalElements(prevElements => [...prevElements, newElement]);
  };

  // 删除元素
  const deleteElement = (id: string) => {
    setLocalElements(prevElements => prevElements.filter(element => element.id !== id));
  };

  // 保存更改
  const saveChanges = () => {
    // 确保localElements是有效的数组
    if (Array.isArray(localElements) && localElements.length > 0) {
      onUpdateElements(localElements);
    } else {
      console.error('No valid elements to save');
    }
    onClose();
  };

  // 处理弹窗外部点击，默认保存
  const handleOverlayClick = () => {
    saveChanges();
  };

  // 动画变体
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // 获取元素类型的显示名称
  const getElementTypeDisplayName = (type: string, additionalProps?: Record<string, any>) => {
    if (additionalProps?.type) {
      switch (additionalProps.type) {
        case 'timeline': return '时间线事件';
        case 'qa': return '问答对';
        case 'honor': return '荣誉卡片';
        case 'carousel': return '轮播图项';
        case 'mentor': return '导师卡片';
        case 'ctf':
        case 'vulnerable': return '平台卡片';
        case 'large':
        case 'small': return '新闻卡片';
      }
    }
    return type;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div 
              className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto z-10"
              variants={contentVariants}
              onClick={e => e.stopPropagation()}
           >
             {/* 弹窗头部 */}
             <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
               <h3 className="text-xl font-bold text-white">{moduleName} - 内容编辑</h3>
               <button 
                 onClick={saveChanges}
                 className="text-gray-400 hover:text-white transition-colors"
                 aria-label="关闭并保存"
               >
                 <i className="fa-solid fa-times text-xl"></i>
               </button>
             </div>

            {/* 弹窗内容 */}
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-300">共 {localElements.length} 个元素</p>
                {(supportsAddDelete && !onlyModify) && (
                  <button 
                    onClick={addElement}
                    className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/80 transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-plus mr-2"></i> 添加元素
                  </button>
                )}
              </div>

              {/* 元素列表 */}
              <div className="space-y-6">
                {localElements.map((element) => {
                  // 排除标题和描述元素的删除按钮（除非是特定模块）
                  const canDelete = supportsAddDelete && 
                    !element.id.includes('title') && 
                    !element.id.includes('description') &&
                    !onlyModify;
                  
                  return (
                    <motion.div 
                      key={element.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <span className="inline-block px-2 py-1 bg-primary-blue/20 text-primary-blue text-xs font-medium rounded-full mr-2">
                            {getElementTypeDisplayName(element.type, element.additionalProps)}
                          </span>
                          <h4 className="font-medium text-white">
                            {element.id.includes('title') ? '模块标题' : 
                             element.id.includes('description') ? '模块描述' : 
                             `元素 ${element.id.split('-')[1]}`}
                          </h4>
                        </div>
                        {canDelete && (
                          <button 
                            onClick={() => deleteElement(element.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="删除元素"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>

                      {/* 元素编辑表单 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 类型选择 - 只有通用模块和非特定元素才显示 */}
                        {moduleType === 'general' && 
                         !element.id.includes('title') && 
                         !element.id.includes('description') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">元素类型</label>
                            <select
                              value={element.type}
                              onChange={(e) => handleInputChange(element.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                            >
                              <option value="text">文本</option>
                              <option value="image">图片</option>
                              <option value="link">链接</option>
                              <option value="card">卡片</option>
                              <option value="other">其他</option>
                            </select>
                          </div>
                        )}

                        {/* 内容字段 */}
                        {element.type === 'text' && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">内容</label>
                            <textarea
                              value={element.content}
                              onChange={(e) => handleInputChange(element.id, 'content', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue min-h-[100px]"
                            />
                          </div>
                        )}

                        {/* 标题字段 */}
                        {(element.type === 'card' || element.type === 'link' || element.id.includes('title')) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">标题</label>
                            <input
                              type="text"
                              value={element.title || element.content}
                              onChange={(e) => {
                                if (element.id.includes('title')) {
                                  handleInputChange(element.id, 'content', e.target.value);
                                } else {
                                  handleInputChange(element.id, 'title', e.target.value);
                                }
                              }}
                              placeholder="输入标题"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                            />
                          </div>
                        )}

                        {/* 描述字段 */}
                        {(element.type === 'card' || element.id.includes('description')) && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">描述</label>
                            <textarea
                              value={element.description || (element.id.includes('description') ? element.content : '')}
                              onChange={(e) => {
                                if (element.id.includes('description')) {
                                  handleInputChange(element.id, 'content', e.target.value);
                                } else {
                                  handleInputChange(element.id, 'description', e.target.value);
                                }
                              }}
                              placeholder="输入描述"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue min-h-[80px]"
                            />
                          </div>
                        )}

                        {/* 图片字段 */}
                        {(element.type === 'image' || element.type === 'card') && (
                          <>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-300 mb-1">图片URL</label>
                              <input
                                type="text"
                                value={element.imageUrl || ''}
                                onChange={(e) => handleInputChange(element.id, 'imageUrl', e.target.value)}
                                placeholder="输入图片URL"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue mb-2"
                              />
                              <div className="flex space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(element.id, e)}
                                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                                />
                              </div>
                            </div>
                            {element.imageUrl && (
                              <div className="md:col-span-2">
                                <img 
                                  src={element.imageUrl} 
                                  alt="预览" 
                                  className="max-w-full max-h-[200px] object-cover rounded-lg border border-gray-600"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* 链接字段 */}
                        {(element.type === 'link' || element.type === 'card') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">链接URL</label>
                            <input
                              type="text"
                              value={element.linkUrl || ''}
                              onChange={(e) => handleInputChange(element.id, 'linkUrl', e.target.value)}
                              placeholder="输入链接URL"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                            />
                          </div>
                        )}

                        {/* 导师特有字段 */}
                        {moduleType === 'mentor' && element.type === 'card' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">导师姓名</label>
                              <input
                                type="text"
                                value={element.name || ''}
                                onChange={(e) => handleInputChange(element.id, 'name', e.target.value)}
                                placeholder="输入导师姓名"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">导师职位</label>
                              <input
                                type="text"
                                value={element.title || ''}
                                onChange={(e) => handleInputChange(element.id, 'title', e.target.value)}
                                placeholder="输入导师职位"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">学校/机构</label>
                              <input
                                type="text"
                                value={element.handle || ''}
                                onChange={(e) => handleInputChange(element.id, 'handle', e.target.value)}
                                placeholder="输入学校/机构名称"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">按钮文字</label>
                              <input
                                type="text"
                                value={element.contactText || ''}
                                onChange={(e) => handleInputChange(element.id, 'contactText', e.target.value)}
                                placeholder="输入按钮文字"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                              />
                            </div>
                          </>
                        )}

                         {/* 学习平台特有字段 */}
                         {(element.additionalProps?.type === 'ctf' || element.additionalProps?.type === 'vulnerable') && element.type === 'card' && (
                           <>
                             <div>
                               <label className="block text-sm font-medium text-gray-300 mb-1">卡片标题</label>
                               <input
                                 type="text"
                                 value={element.title || ''}
                                 onChange={(e) => handleInputChange(element.id, 'title', e.target.value)}
                                 placeholder="输入卡片标题"
                                 className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                               />
                             </div>
                             <div>
                               <label className="block text-sm font-medium text-gray-300 mb-1">卡片描述</label>
                               <input
                                 type="text"
                                 value={element.description || ''}
                                 onChange={(e) => handleInputChange(element.id, 'description', e.target.value)}
                                 placeholder="输入卡片描述"
                                 className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                               />
                             </div>
                             
                             {/* 平台链接编辑字段 */}
                             {element.additionalProps?.platforms && Array.isArray(element.additionalProps.platforms) && (
                               <div className="md:col-span-2 mt-4">
                                 <label className="block text-sm font-medium text-gray-300 mb-2">平台链接</label>
                                 {element.additionalProps.platforms.map((platform: any, index: number) => (
                                   <div key={index} className="grid grid-cols-2 gap-3 mb-3">
                                     <div>
                                       <label className="block text-xs font-medium text-gray-400 mb-1">名称</label>
                                       <input
                                         type="text"
                                         value={platform.name || ''}
                                         onChange={(e) => {
                                           const updatedPlatforms = [...element.additionalProps.platforms];
                                           updatedPlatforms[index] = {
                                             ...updatedPlatforms[index],
                                             name: e.target.value
                                           };
                                           const updatedProps = {
                                             ...element.additionalProps,
                                             platforms: updatedPlatforms
                                           };
                                           handleInputChange(element.id, 'additionalProps', updatedProps);
                                         }}
                                         placeholder="平台名称"
                                         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                                       />
                                     </div>
                                     <div>
                                       <label className="block text-xs font-medium text-gray-400 mb-1">URL</label>
                                       <input
                                         type="text"
                                         value={platform.url || ''}
                                         onChange={(e) => {
                                           const updatedPlatforms = [...element.additionalProps.platforms];
                                           updatedPlatforms[index] = {
                                             ...updatedPlatforms[index],
                                             url: e.target.value
                                           };
                                           const updatedProps = {
                                             ...element.additionalProps,
                                             platforms: updatedPlatforms
                                           };
                                           handleInputChange(element.id, 'additionalProps', updatedProps);
                                         }}
                                         placeholder="平台URL"
                                         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                                       />
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </>
                         )}

                        {/* 时间线特有字段 */}
                        {element.additionalProps?.type === 'timeline' && element.type === 'card' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">年份</label>
                            <input
                              type="number"
                              value={element.additionalProps?.year || ''}
                              onChange={(e) => {
                                const updatedProps = {
                                  ...element.additionalProps,
                                  year: parseInt(e.target.value)
                                };
                                handleInputChange(element.id, 'additionalProps', updatedProps);
                              }}
                              placeholder="输入年份"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                            />
                          </div>
                        )}

                        {/* 问答对特有字段 */}
                        {element.additionalProps?.type === 'qa' && element.type === 'card' && (
                          <>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-300 mb-1">问题</label>
                              <textarea
                                value={element.title || ''}
                                onChange={(e) => handleInputChange(element.id, 'title', e.target.value)}
                                placeholder="输入问题"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue min-h-[80px]"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-300 mb-1">回答</label>
                              <textarea
                                value={element.description || ''}
                                onChange={(e) => handleInputChange(element.id, 'description', e.target.value)}
                                placeholder="输入回答"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue min-h-[120px]"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-gray-800 flex justify-end space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={saveChanges}
                className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/80 transition-colors"
              >
                保存更改
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModuleEditorModal;