import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 时间线事件类型定义
interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  imageUrl: string;
}

// 3D卡片容器组件
const CardContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div 
      className={cn('flex items-center justify-center p-2', className)}
      style={{ perspective: '1000px' }}
    >
      {children}
    </div>
  );
};

// 3D卡片主体组件
const CardBody: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({ 
  children, 
  className = '',
  onMouseEnter,
  onMouseLeave
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 鼠标移动处理函数
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };

  // 鼠标进入处理函数
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onMouseEnter) onMouseEnter();
  };

  // 鼠标离开处理函数
  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    setIsHovered(false);
    if (onMouseLeave) onMouseLeave();
  };

  // 创建一个上下文值，用于传递给子组件
  const contextValue = {
    isHovered
  };

  // 将isHovered状态传递给所有子组件
  const renderChildren = () => {
    // 检查children是否为数组
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (React.isValidElement(child) && child.type === CardItem) {
          // 对于CardItem组件，添加isHovered属性
          return React.cloneElement(child, { 
            key: index, 
            isHovered: contextValue.isHovered 
          });
        }
        return child;
      });
    }
    
    // 处理单个子元素的情况
    if (React.isValidElement(children) && children.type === CardItem) {
      return React.cloneElement(children, { isHovered: contextValue.isHovered });
    }
    
    return children;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'group/card relative size-auto rounded-xl border border-black/[0.1] bg-gray-50 p-6 sm:w-[30rem] dark:border-white/[0.2] dark:bg-black dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1]',
        className
      )}
      style={{ 
        transformStyle: 'preserve-3d', 
        transition: 'transform 0.1s ease-out'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {renderChildren()}
    </div>
  );
};

// 3D卡片项组件
const CardItem: React.FC<{ 
  children: React.ReactNode; 
  translateZ?: number; 
  className?: string;
  as?: 'div' | 'h3' | 'p' | 'img' | 'a' | 'button';
  isHovered?: boolean; // 新增属性，用于接收父组件的悬浮状态
}> = ({ 
  children, 
  translateZ = 50, 
  className = '',
  as: Tag = 'div',
  isHovered = false
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  // 当isHovered状态改变时应用或移除3D效果
  useEffect(() => {
    if (!itemRef.current) return;
    
    if (isHovered) {
      itemRef.current.style.transform = `translateZ(${translateZ}px)`;
    } else {
      itemRef.current.style.transform = 'translateZ(0)';
    }
  }, [isHovered, translateZ]);

  const TagElement = Tag;
  
  return (
    <div 
      ref={itemRef}
      className={className}
      style={{ 
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease-out',
        transform: isHovered ? `translateZ(${translateZ}px)` : 'translateZ(0)'
      }}
    >
      <TagElement>{children}</TagElement>
    </div>
  );
};

interface TimelineProps {
  canEdit?: boolean;
}

const Timeline = ({ canEdit = false }: TimelineProps) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(0);

   // 时间线数据
  const timelineEvents: TimelineEvent[] = [
    {
      year: 2020,
      title: '社团成立',
      description: '内蒙古科技大学网络安全社团正式成立，首批成员20人',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20club%20founding%20ceremony&sign=860fea57b17893ebe16436a36a9021d8'
    },
    {
      year: 2021,
      title: '首次参赛',
      description: '首次参加自治区级CTF大赛并获得团队三等奖',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=CTF%20competition%20team%20photo&sign=53d46542aad693cd96581e6c03b4ebf9'
    },
    {
      year: 2022,
      title: '规模扩大',
      description: '社团成员扩大到50人，成立了专业培训小组',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20club%20training%20session&sign=e3a602d0f5262dddcc0137cda730f70b'
    },
    {
      year: 2023,
      title: '全国获奖',
      description: '在全国大学生信息安全竞赛中获得二等奖',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=national%20cybersecurity%20competition%20award%20ceremony&sign=325574073f44a9b28ff592491456e455'
    },
    {
      year: 2024,
      title: '校企合作',
      description: '与多家知名企业建立校企合作关系，共建实训基地',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=university%20enterprise%20cooperation%20signing&sign=36e0f11824965e4253b3941cea5bb190'
    }
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '社团历程',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    {
      id: 'description',
      type: 'text',
      content: '回顾内蒙古科技大学网络安全社团的发展历程，见证我们的成长与成就',
      additionalProps: { fontSize: '1rem', color: 'text-gray-300' }
    },
    ...timelineEvents.map(event => ({
      id: `timeline-${event.year}`,
      type: 'card',
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      additionalProps: { 
        type: 'timeline',
        year: event.year
      }
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
    moduleId: 'timeline-section',
    initialElements,
    canEdit
  });

  // 获取滚动进度和动画值
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 10%", "end 50%"],
  });
  
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const heightTransform = useTransform(
    scrollYProgress, 
    [0, 1], 
    [0, timelineHeight]
  );

  // 检测元素是否在视口中并更新时间线高度
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          controls.start('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [controls]);

  // 计算时间线高度
  useEffect(() => {
    const calculateHeight = () => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        setTimelineHeight(rect.height);
      }
    };

    // 初始计算
    calculateHeight();
    
    // 监听窗口大小变化
    window.addEventListener('resize', calculateHeight);
    
    // 组件卸载时清除监听
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, [elements]);

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  // 从元素中分离出不同类型的数据
  const titleElement = elements.find(el => el.id === 'title') || initialElements[0];
  const descriptionElement = elements.find(el => el.id === 'description') || initialElements[1];
  const timelineElements = elements
    .filter(el => el.id.startsWith('timeline-'))
    .sort((a, b) => {
      const yearA = parseInt(a.id.split('-')[1]) || 0;
      const yearB = parseInt(b.id.split('-')[1]) || 0;
      return yearA - yearB;
    });

  return (
     <section 
       ref={ref} 
       className="py-20 bg-black/40 backdrop-blur-sm cursor-pointer"
       onClick={handleModuleClick}
     >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-orbitron font-bold text-white mb-4">
            {titleElement.content}
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {descriptionElement.content}
          </p>
        </div>

        <motion.div 
          className="relative max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {/* 时间线中心线 - 替换为新样式 */}
          <div
            ref={timelineRef}
            className="relative z-0 mx-auto"
          >
            {/* 改进的时间线连接线 */}
            <div
              style={{
                height: `${timelineHeight}px`,
              }}
              className="absolute left-1/2 top-0 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-0% via-neutral-200/30 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] transform -translate-x-1/2"
            >
              <motion.div
                style={{
                  height: heightTransform,
                  opacity: opacityTransform,
                }}
                className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-purple-500 from-0% via-blue-500 via-10% to-transparent"
              />
            </div>

           {/* 时间线事件 */}
           {timelineElements.map((event, index) => {
             const year = parseInt(event.id.split('-')[1]) || 0;
             return (
              <motion.div
                key={event.id}
                variants={itemVariants}
                className="relative mb-16"
              >
                {/* 时间点 */}
                <div className="absolute left-1/2 top-0 w-5 h-5 rounded-full bg-primary-blue transform -translate-x-1/2 border-4 border-white/80 dark:border-gray-900 z-10"></div>
                
                {/* 年份标签 */}
                <div className="absolute left-1/2 top-0 -translate-y-8 -translate-x-1/2 font-orbitron font-bold text-xl text-primary-blue dark:text-primary-blue">
                  {year}
                </div>
                
                {/* 左右交替的内容卡片 */}
                {index % 2 === 0 ? (
                  <div className="flex justify-end">
                    <CardContainer className="w-full md:w-5/12 md:mr-8">
                      <CardBody 
                        onMouseEnter={() => setActiveYear(year)}
                        onMouseLeave={() => setActiveYear(null)}
                      >
                        <CardItem translateZ={50} className="text-xl font-bold text-neutral-600 dark:text-white mb-2">
                          {event.title}
                        </CardItem>
                        <CardItem 
                          translateZ={60} 
                          as="p"
                          className="text-sm text-neutral-500 dark:text-neutral-300 mb-4"
                        >
                          {event.description}
                        </CardItem>
                        <CardItem translateZ={100} className="w-full">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title}
                            className="w-full h-60 object-cover rounded-xl group-hover/card:shadow-xl"
                          />
                        </CardItem>
                      </CardBody>
                    </CardContainer>
                  </div>
                ) : (
                  <div className="flex">
                    <CardContainer className="w-full md:w-5/12 md:ml-8">
                      <CardBody 
                        onMouseEnter={() => setActiveYear(year)}
                        onMouseLeave={() => setActiveYear(null)}
                      >
                        <CardItem translateZ={50} className="text-xl font-bold text-neutral-600 dark:text-white mb-2">
                          {event.title}
                        </CardItem>
                        <CardItem 
                          translateZ={60} 
                          as="p"
                          className="text-sm text-neutral-500 dark:text-neutral-300 mb-4"
                        >
                          {event.description}
                        </CardItem>
                        <CardItem translateZ={100} className="w-full">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title}
                            className="w-full h-60 object-cover rounded-xl group-hover/card:shadow-xl"
                          />
                        </CardItem>
                      </CardBody>
                    </CardContainer>
                  </div>
                )}
              </motion.div>
            );
           })}
          </div>
        </motion.div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        moduleName="社团历程"
        elements={elements}
        onUpdateElements={updateElements}
        moduleType="timeline"
        supportsAddDelete={true}
      />
    </section>
  );
}

export default Timeline;