import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 轮播项类型定义
interface CarouselItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
}

interface CarouselProps {
  canEdit?: boolean;
}

const Carousel = ({ canEdit = false }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 轮播数据
  const carouselItems: CarouselItem[] = [
    {
      id: 1,
      title: '网络安全知识竞赛',
      description: '提升安全意识，锻炼实战能力',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=cybersecurity%20knowledge%20competition%20with%20students%20participating&sign=00fa3ad751a741616f97922e730227c6',
      linkUrl: '/news/security-competition'
    },
    {
      id: 2,
      title: 'CTF全国大赛获奖',
      description: '社团成员在全国CTF大赛中取得优异成绩',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=CTF%20competition%20winners%20with%20trophies&sign=5702125b70e2e133095cbbe5f0f45c22',
      linkUrl: '/achievements/ctf-winners'
    },
    {
      id: 3,
      title: '网络安全讲座',
      description: '邀请行业专家分享前沿技术与经验',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=cybersecurity%20lecture%20with%20audience&sign=0ce753150faeaf72446d6d7dd4a2adab',
      linkUrl: '/news/security-lecture'
    }
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'carousel-title',
      type: 'text',
      content: '轮播图配置',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    ...carouselItems.map(item => ({
      id: `carousel-${item.id}`,
      type: 'card',
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      additionalProps: { type: 'carousel' }
    }))
  ];

  const {
    elements,
    isModalOpen,
    openModal,
    closeModal,
    updateElements,
    handleModuleClick
  } = useModuleEditor({
    moduleId: 'carousel-section',
    initialElements,
    canEdit
  });

  // 自动轮播
  useEffect(() => {
    const startInterval = () => {
      if (!isPaused) {
        const carouselElements = elements.filter(el => el.id.startsWith('carousel-') && el.id !== 'carousel-title');
        if (carouselElements.length > 0) {
          intervalRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => 
              prevIndex === carouselElements.length - 1 ? 0 : prevIndex + 1
            );
          }, 5000);
        }
      }
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, elements]);

  // 暂停/继续自动轮播
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // 切换到指定轮播项
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 下一个轮播项
  const nextSlide = () => {
    const carouselElements = elements.filter(el => el.id.startsWith('carousel-') && el.id !== 'carousel-title');
    if (carouselElements.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === carouselElements.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // 上一个轮播项
  const prevSlide = () => {
    const carouselElements = elements.filter(el => el.id.startsWith('carousel-') && el.id !== 'carousel-title');
    if (carouselElements.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? carouselElements.length - 1 : prevIndex - 1
      );
    }
  };

   // 处理了解详情按钮点击
  const handleDetailClick = (linkUrl?: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (linkUrl) {
      toast(`即将跳转到: ${linkUrl}`);
      window.location.href = linkUrl;
    } else {
      toast('暂无相关链接');
    }
  };

  // 从元素中分离出轮播数据
  const carouselElements = elements.filter(el => el.id.startsWith('carousel-') && el.id !== 'carousel-title');

  return (
    <div 
      ref={carouselRef}
      className="relative h-[70vh] min-h-[500px] overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleModuleClick}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img 
            src={carouselElements[currentIndex]?.imageUrl || ''} 
            alt={carouselElements[currentIndex]?.title || ''}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16">
            <motion.h2 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-[clamp(2rem,5vw,4rem)] font-orbitron font-bold text-white text-shadow mb-4"
            >
              {carouselElements[currentIndex]?.title || ''}
            </motion.h2>
            <motion.p 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-[clamp(1rem,2vw,1.5rem)] text-white text-shadow max-w-2xl mb-8"
            >
              {carouselElements[currentIndex]?.description || ''}
            </motion.p>
            <motion.button 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="px-8 py-3 bg-gradient-blue text-white font-medium rounded-full inline-flex items-center hover:shadow-lg transition-all w-fit"
              onClick={(e) => handleDetailClick(carouselElements[currentIndex]?.linkUrl, e)}
            >
              了解详情
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 轮播指示器 */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3 z-30">
        {carouselElements.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              currentIndex === index 
                ? 'w-10 bg-white' 
                : 'bg-white/50'
            )}
            aria-label={`切换到第 ${index + 1} 张幻灯片`}
          ></button>
        ))}
      </div>

      {/* 左右箭头 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-all z-30"
        aria-label="上一张幻灯片"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-all z-30"
        aria-label="下一张幻灯片"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        moduleName="轮播图"
        elements={elements}
        onUpdateElements={updateElements}
        moduleType="carousel"
        supportsAddDelete={true}
      />
    </div>
  );
};

export default Carousel;