import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 赛事类型定义
interface Competition {
  id: number;
  name: string;
  date: string;
  description: string;
  icon: string;
}

// 荣誉类型定义
interface Honor {
  id: number;
  title: string;
  description: string;
  year: string;
  imageUrl: string;
}

interface AchievementsProps {
  canEdit?: boolean;
}

const Achievements = ({ canEdit = false }: AchievementsProps) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentHonorIndex, setCurrentHonorIndex] = useState(0);

  // 赛事数据
  const competitions: Competition[] = [
    {
      id: 1,
      name: '全国大学生信息安全竞赛',
      date: '每年5-8月',
      description: '国家级A类赛事，展示网络安全技术水平',
      icon: 'fa-trophy'
    },
    {
      id: 2,
      name: 'CTF网络安全挑战赛',
      date: '全年多次',
      description: '国际流行的网络安全技术竞赛形式',
      icon: 'fa-shield-alt'
    },
    {
      id: 3,
      name: '网络安全攻防演练',
      date: '每年10月',
      description: '模拟真实网络攻击与防御场景',
      icon: 'fa-chess'
    },
    {
      id: 4,
      name: '网络安全知识竞赛',
      date: '每年4月',
      description: '普及网络安全知识，提升安全意识',
      icon: 'fa-book'
    },
    {
      id: 5,
      name: '信息安全创新创业大赛',
      date: '每年6月',
      description: '结合技术创新与创业实践',
      icon: 'fa-lightbulb'
    },
    {
      id: 6,
      name: '自治区网络安全技能大赛',
      date: '每年9月',
      description: '自治区级权威赛事，选拔优秀人才',
      icon: 'fa-medal'
    }
  ];

  // 荣誉数据
  const honors: Honor[] = [
    {
      id: 1,
      title: '全国大学生信息安全竞赛二等奖',
      description: '在2023年全国大学生信息安全竞赛中荣获二等奖',
      year: '2023',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=national%20cybersecurity%20competition%20award&sign=814c1ae9ba07d977c4c2cb1e0ee3a5f6'
    },
    {
      id: 2,
      title: '自治区CTF大赛冠军',
      description: '在2024年自治区CTF网络安全挑战赛中获得冠军',
      year: '2024',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=regional%20CTF%20competition%20champion&sign=66090ce519656d116608697b8b2915b8'
    },
    {
      id: 3,
      title: '网络安全攻防演练优秀团队',
      description: '在2023年网络安全攻防演练中被评为优秀团队',
      year: '2023',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=cybersecurity%20defense%20exercise%20excellent%20team&sign=7c2910f17a340015e50d5b7edc40b684'
    }
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '赛事与荣誉',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    {
      id: 'description',
      type: 'text',
      content: '展示我们参与的重要赛事和获得的荣誉成就',
      additionalProps: { fontSize: '1rem', color: 'gray-500 dark:text-gray-400' }
    },
    ...competitions.map(competition => ({
      id: `competition-${competition.id}`,
      type: 'card',
      title: competition.name,
      description: competition.description,
      additionalProps: { 
        date: competition.date,
        icon: competition.icon
      }
    })),
    ...honors.map(honor => ({
      id: `honor-${honor.id}`,
      type: 'card',
      title: honor.title,
      description: honor.description,
      imageUrl: honor.imageUrl,
      additionalProps: { 
        year: honor.year
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
    moduleId: 'achievements-section',
    initialElements,
    canEdit
  });

  // 检测元素是否在视口中
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

  // 下一个荣誉
  const nextHonor = () => {
    setCurrentHonorIndex((prevIndex) => 
      prevIndex === honors.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 上一个荣誉
  const prevHonor = () => {
    setCurrentHonorIndex((prevIndex) => 
      prevIndex === 0 ? honors.length - 1 : prevIndex - 1
    );
  };

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  // 计算3D轮播的样式
  const getHonorStyle = (index: number) => {
    if (index === currentHonorIndex) {
      return {
        transform: 'translateZ(100px) scale(1)',
        opacity: 1,
        zIndex: 3,
      };
    } else if (index === (currentHonorIndex + 1) % honors.length) {
      return {
        transform: 'translateX(100px) rotateY(-45deg) translateZ(-50px) scale(0.8)',
        opacity: 0.6,
        zIndex: 2,
      };
    } else {
      return {
        transform: 'translateX(-100px) rotateY(45deg) translateZ(-50px) scale(0.8)',
        opacity: 0.6,
        zIndex: 2,
      };
    }
  };

  // 从元素中分离出不同类型的数据
  const titleElement = elements.find(el => el.id === 'title') || initialElements[0];
  const descriptionElement = elements.find(el => el.id === 'description') || initialElements[1];
  const competitionElements = elements.filter(el => el.id.startsWith('competition-'));
  const honorElements = elements.filter(el => el.id.startsWith('honor-'));

  return (
     <section 
      ref={ref} 
      className="py-20 bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={handleModuleClick}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-orbitron font-bold text-gray-800 dark:text-white mb-4">
            {titleElement.content}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {descriptionElement.content}
          </p>
        </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧赛事列表（可滚动） */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="h-96 overflow-y-auto pr-2 custom-scrollbar"
          >
            <div className="space-y-4">
              {competitionElements.map((competition) => (
                <motion.div
                  key={competition.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 card-hover"
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-primary-blue mr-4">
                      <i className={`fa-solid ${competition.additionalProps?.icon || 'fa-trophy'} text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                        {competition.title}
                      </h3>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                        <i className="fa-solid fa-calendar mr-2"></i>
                        <span>{competition.additionalProps?.date}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {competition.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 右侧荣誉轮播 */}
          <div className="relative h-96 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              {honorElements.map((honor, index) => (
                <motion.div
                  key={honor.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    ...getHonorStyle(index)
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute w-64 h-80 bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="relative h-48">
                    {honor.imageUrl && (
                      <img 
                        src={honor.imageUrl} 
                        alt={honor.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-gradient-blue flex items-center justify-center text-white font-bold">
                      {honor.additionalProps?.year}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                      {honor.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                      {honor.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 左右箭头 */}
            <button
              onClick={prevHonor}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-primary-blue flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10"
              aria-label="上一个荣誉"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              onClick={nextHonor}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-primary-blue flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10"
              aria-label="下一个荣誉"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
         moduleName="赛事与荣誉"
         elements={elements}
         onUpdateElements={updateElements}
         moduleType="competition"
         supportsAddDelete={true}
      />
    </section>
  );
};

export default Achievements;