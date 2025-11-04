import React, { useState, useRef, useEffect } from 'react';
import { ModuleElement } from '@/components/ModuleEditorModal';

// Hook属性定义
interface UseModuleEditorProps {
  moduleId: string;
  initialElements: ModuleElement[];
  canEdit?: boolean;
}

// Hook返回值类型定义
interface UseModuleEditorReturn {
  elements: ModuleElement[];
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  updateElements: (elements: ModuleElement[]) => void;
  handleModuleClick: (e: React.MouseEvent) => void;
  getElementRef: (id: string) => React.RefObject<HTMLDivElement>;
}

const useModuleEditor = ({ moduleId, initialElements, canEdit = false }: UseModuleEditorProps): UseModuleEditorReturn => {
  // 确保从localStorage加载数据时正确初始化状态
  const [elements, setElements] = useState<ModuleElement[]>(() => {
    const savedElements = localStorage.getItem(`module-${moduleId}-elements`);
    if (savedElements) {
      try {
        const parsed = JSON.parse(savedElements);
        // 验证解析结果是否为数组
        return Array.isArray(parsed) ? parsed : initialElements;
      } catch (e) {
        console.error('Failed to parse saved elements:', e);
        return initialElements;
      }
    }
    return initialElements;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const elementRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

  // 初始化元素引用
  useEffect(() => {
    initialElements.forEach(element => {
      if (!elementRefs.current[element.id]) {
        elementRefs.current[element.id] = React.createRef();
      }
    });
  }, [initialElements]);

  // 保存数据到本地存储
  useEffect(() => {
    // 确保只在元素真正变化时保存到localStorage
    try {
      // 确保elements是有效数组后再保存
      if (Array.isArray(elements) && elements.length > 0) {
        localStorage.setItem(`module-${moduleId}-elements`, JSON.stringify(elements));
      } else {
        // 如果elements无效，保存初始数据
        localStorage.setItem(`module-${moduleId}-elements`, JSON.stringify(initialElements));
      }
    } catch (e) {
      console.error('Failed to save elements to localStorage:', e);
    }
  }, [elements, moduleId, initialElements]);

  // 打开弹窗
  const openModal = () => {
    setIsModalOpen(true);
  };

  // 关闭弹窗
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 更新元素 - 增强稳定性，防止页面崩溃
  const updateElements = (newElements: ModuleElement[]) => {
    try {
      // 确保新元素数组是有效的
      if (Array.isArray(newElements)) {
        // 过滤掉无效的元素
        const validElements = newElements.filter(element => 
          element && 
          typeof element.id === 'string' && 
          element.id.length > 0 &&
          (element.type === 'text' || 
           element.type === 'image' || 
           element.type === 'link' || 
           element.type === 'card' || 
           element.type === 'other')
        );
        
        // 确保至少保留一个有效的元素
        const elementsToSave = validElements.length > 0 ? validElements : initialElements;
        
        setElements(elementsToSave);
        
        // 为新元素创建引用
        elementsToSave.forEach(element => {
          if (!elementRefs.current[element.id]) {
            elementRefs.current[element.id] = React.createRef();
          }
        });
      } else {
        console.error('Invalid elements array provided to updateElements');
        // 使用初始元素作为后备
        setElements(initialElements);
      }
    } catch (error) {
      console.error('Error updating elements:', error);
      // 出错时使用初始元素
      setElements(initialElements);
    }
  };

  // 处理模块点击
  const handleModuleClick = (e: React.MouseEvent) => {
    // 如果没有编辑权限，不执行任何操作
    if (!canEdit) {
      return;
    }
    
    try {
      // 检查点击目标是否是按钮或其子元素
      const target = e.target as HTMLElement;
      
      // 如果点击的是按钮或按钮内的元素，则不触发弹窗
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }
      
      // 如果点击的是链接或链接内的元素，则不触发弹窗
      if (target.tagName === 'A' || target.closest('a')) {
        return;
      }
      
      openModal();
    } catch (error) {
      console.error('Error handling module click:', error);
      openModal();
    }
  };

  // 获取元素引用
  const getElementRef = (id: string) => {
    if (!elementRefs.current[id]) {
      elementRefs.current[id] = React.createRef();
    }
    return elementRefs.current[id];
  };

  return {
    elements,
    isModalOpen,
    openModal,
    closeModal,
    updateElements,
    handleModuleClick,
    getElementRef
  };
};

export default useModuleEditor;