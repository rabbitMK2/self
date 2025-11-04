import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 平台链接类型定义
interface PlatformLink {
  id: number;
  name: string;
  url: string;
  icon: string;
}

interface PlatformsProps {
  canEdit?: boolean;
}

const Platforms = ({ canEdit = false }: PlatformsProps) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // CTF平台链接
  const ctfPlatforms: PlatformLink[] = [
    {
      id: 1,
      name: 'CTFHub',
      url: 'https://ctfhub.com',
      icon: 'fa-flag'
    },
    {
      id: 2,
      name: '攻防世界',
      url: 'https://adworld.xctf.org.cn',
      icon: 'fa-shield-alt'
    }
  ];

  // 靶场链接
  const vulnerablePlatforms: PlatformLink[] = [
    {
      id: 3,
      name: 'DVWA',
      url: 'https://dvwa.co.uk',
      icon: 'fa-virus'
    },
    {
      id: 4,
      name: 'OWASP Juice Shop',
      url: 'https://owasp.org/www-project-juice-shop',
      icon: 'fa-glass-cheers'
    }
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '学习平台',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    {
      id: 'description',
      type: 'text',
      content: '推荐的网络安全学习和实践平台，帮助成员提升技能水平',
      additionalProps: { fontSize: '1rem', color: 'text-gray-500 dark:text-gray-400' }
    },
    {
      id: 'ctf-card',
      type: 'card',
      title: 'CTF平台',
      description: '提升实战能力的 Capture The Flag 平台',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=cybersecurity%20CTF%20competition%20digital%20interface&sign=4be4384ad1cfdfc96fd4991be0560265',
      additionalProps: {
        gradient: 'from-blue-900/90 to-blue-500/70',
        icon: 'fa-crosshairs',
        platforms: ctfPlatforms,
        platformType: 'ctf'
      }
    },
    {
      id: 'vulnerable-card',
      type: 'card',
      title: '靶场合集',
      description: '安全漏洞测试和学习的实践环境',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=cybersecurity%20vulnerability%20testing%20lab%20digital%20interface&sign=882b88ebd45626739004054c8acff723',
      additionalProps: {
        gradient: 'from-purple-900/90 to-purple-500/70',
        icon: 'fa-bullseye',
        platforms: vulnerablePlatforms,
        platformType: 'vulnerable'
      }
    }
  ];

  const {
    elements,
    isModalOpen,
    openModal,
    closeModal,
    updateElements,
    handleModuleClick
  } = useModuleEditor({
    moduleId: 'platforms-section',
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

   // 处理链接点击
  const handleLinkClick = (url: string, event: React.MouseEvent) => {
    event.preventDefault();
    toast(`即将跳转到 ${url}`);
    window.open(url, '_blank');
  };

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
  const cardElements = elements.filter(el => el.type === 'card');

  // 直接使用从编辑弹窗中获取的平台数据，确保修改后的数据能立即显示
  // 不再需要额外的链接元素查找，因为所有数据都在card.additionalProps.platforms中
  const updatedCards = cardElements;

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

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
            {/* 平台卡片 */}
          {updatedCards.map((card, index) => (
            <motion.div
              key={card.id}
              variants={itemVariants}
              className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden card-hover"
              onMouseEnter={() => setHoveredCard(index + 1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative h-40 overflow-hidden">
                {card.imageUrl && (
                  <img 
                    src={card.imageUrl} 
                    alt={card.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.additionalProps?.gradient || 'from-blue-900/90 to-blue-500/70'} flex flex-col justify-center p-6 text-white`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <i className={`fa-solid ${card.additionalProps?.icon || 'fa-crosshairs'} text-2xl`}></i>
                    </div>
                    <h3 className="text-xl font-bold">{card.title}</h3>
                  </div>
                  <p className="mt-2 text-white/80">{card.description}</p>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {/* 直接使用card.additionalProps.platforms中的数据，确保修改后的数据能立即显示 */}
                  {(card.additionalProps?.platforms as PlatformLink[] || []).map((platform) => (
                    <motion.li 
                      key={platform.id || Math.random()}
                      className="flex items-center"
                      whileHover={{ x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`w-10 h-10 rounded-full ${
                        card.additionalProps?.platformType === 'ctf' 
                          ? 'bg-blue-100 dark:bg-blue-900 text-primary-blue' 
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                      } flex items-center justify-center mr-4`}>
                        <i className={`fa-solid ${platform.icon || 'fa-link'}`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white">{platform.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{platform.url}</p>
                      </div>
                      <a 
                        href={platform.url} 
                        onClick={(e) => handleLinkClick(platform.url, e)}
                        className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:${
                          card.additionalProps?.platformType === 'ctf' 
                            ? 'bg-primary-blue' 
                            : 'bg-purple-600'
                        } hover:text-white transition-colors`}
                      >
                        <i className="fa-solid fa-external-link-alt"></i>
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
         moduleName="学习平台"
       elements={elements}
      onUpdateElements={updateElements}
      supportsAddDelete={true}
      />
    </section>
  );
};

export default Platforms;