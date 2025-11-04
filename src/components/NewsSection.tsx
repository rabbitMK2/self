import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 新闻类型定义
interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  imageUrl: string;
}

interface NewsSectionProps {
  canEdit?: boolean;
}

const NewsSection = ({ canEdit = false }: NewsSectionProps) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // 左侧要闻数据（两个）
  const leftNews: NewsItem[] = [
    {
      id: 1,
      title: '我校成功举办第十三届网络安全知识竞赛',
      date: '2024-10-15',
      category: '竞赛活动',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=cybersecurity%20competition%20with%20students%20and%20awards&sign=f36197a7eee353be6966cc10992f0656'
    },
    {
      id: 2,
      title: '网络安全攻防演练圆满结束',
      date: '2024-09-30',
      category: '实践活动',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=cybersecurity%20defense%20exercise&sign=8c8a097eb4f66ff7718bc4ff7773ff8c'
    }
  ];

  // 小新闻数据
  const smallNews: NewsItem[] = [
    {
      id: 2,
      title: '社团成员在全国CTF大赛中荣获二等奖',
      date: '2024-09-28',
      category: '赛事荣誉',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=CTF%20competition%20with%20trophy&sign=dbc3f893e5b67304ab315f30ddec76d6'
    },
    {
      id: 3,
      title: '知名安全专家到校开展网络安全前沿技术讲座',
      date: '2024-09-15',
      category: '学术活动',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20lecture%20hall&sign=e87154b67fbf0b67f042fc00695dc1a9'
    },
    {
      id: 4,
      title: '2024级新生招新工作圆满完成',
      date: '2024-09-05',
      category: '社团活动',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=student%20club%20recruitment&sign=14a5231a834cb90b3508272c0638f80a'
    },
    {
      id: 5,
      title: '社团与多家知名企业建立校企合作关系',
      date: '2024-08-20',
      category: '合作交流',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=university%20enterprise%20cooperation&sign=7f72f7103a5feae08fc3e58a40a0f4e0'
    },
     
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '社团要闻',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    {
      id: 'description',
      type: 'text',
      content: '了解内蒙古科技大学网络安全社团的最新动态和重要活动',
      additionalProps: { fontSize: '1rem', color: 'gray-300' }
    },
    ...leftNews.map(news => ({
      id: `left-news-${news.id}`,
      type: 'card',
      title: news.title,
      description: `${news.category} · ${news.date}`,
      imageUrl: news.imageUrl,
      additionalProps: { size: 'large' }
    })),
    ...smallNews.map(news => ({
      id: `small-news-${news.id}`,
      type: 'card',
      title: news.title,
      description: `${news.category} · ${news.date}`,
      imageUrl: news.imageUrl,
      additionalProps: { size: 'small' }
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
    moduleId: 'news-section',
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

  // 从元素中分离出不同类型的数据
  const titleElement = elements.find(el => el.id === 'title') || initialElements[0];
  const descriptionElement = elements.find(el => el.id === 'description') || initialElements[1];
  const leftNewsElements = elements.filter(el => el.id.startsWith('left-news-'));
  const smallNewsElements = elements.filter(el => el.id.startsWith('small-news-'));

  return (
      <section 
        ref={ref} 
        className="py-20 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={handleModuleClick}
      >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-orbitron font-bold text-white mb-2">
              {titleElement.content}
            </h2>
            <p className="text-gray-300 max-w-2xl">
              {descriptionElement.content}
            </p>
          </div>
          <a 
            href="/news" 
            className="mt-4 md:mt-0 px-6 py-2 bg-white/10 border border-white/20 rounded-full text-white font-medium inline-flex items-center hover:bg-white/20 transition-colors"
          >
            查看全部
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </a>
        </div>

         <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {/* 左侧两个要闻 */}
          <div className="lg:col-span-2 space-y-6">
            {leftNewsElements.map((news) => (
              <motion.div 
                key={news.id}
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 card-hover"
              >
                <div className="relative h-48 md:h-64">
                  {news.imageUrl && (
                    <img 
                      src={news.imageUrl} 
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {news.description && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-blue text-white text-xs font-medium rounded-full">
                      {news.description.split(' · ')[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white text-shadow mb-2">
                      {news.title}
                    </h3>
                    {news.description && (
                      <div className="flex items-center text-white/80 text-sm">
                        <i className="fa-solid fa-calendar mr-2"></i>
                        <span>{news.description.split(' · ')[1]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 右侧小新闻 */}
          <div className="grid grid-cols-2 gap-6">
            {smallNewsElements.map((news) => (
              <motion.div
                key={news.id}
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 card-hover"
              >
                <div className="relative h-32">
                  {news.imageUrl && (
                    <img 
                      src={news.imageUrl} 
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                </div>
                <div className="p-3">
                  {news.description && (
                    <span className="text-xs text-primary-blue dark:text-primary-blue font-medium">
                      {news.description.split(' · ')[0]}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold mt-1 line-clamp-2 text-gray-800 dark:text-white">
                    {news.title}
                  </h3>
                  {news.description && (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mt-2">
                      <i className="fa-solid fa-calendar mr-1"></i>
                      <span>{news.description.split(' · ')[1]}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        moduleName="社团要闻"
        elements={elements}
        onUpdateElements={updateElements}
      />
    </section>
  );
};

export default NewsSection;