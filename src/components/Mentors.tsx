import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 导师类型定义
interface Mentor {
  id: number;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  status: string;
}

// ProfileCard组件属性定义
interface ProfileCardProps {
  name: string;
  title: string;
  handle: string;
  status: string;
  contactText: string;
  avatarUrl: string;
  iconUrl?: string;
  grainUrl?: string;
  behindGradient?: string;
  innerGradient?: string;
  showBehindGradient?: boolean;
  className?: string;
  enableTilt?: boolean;
  miniAvatarUrl?: string;
  showUserInfo?: boolean;
  onContactClick: () => void;
}

// ProfileCard组件 - 严格按照提供的Vue代码转换
const ProfileCard: React.FC<ProfileCardProps> = ({
  name = 'Javi A. Torres',
  title = 'Software Engineer',
  handle = 'javicodes',
  status = 'Online',
  contactText = 'Contact',
  avatarUrl = '<Placeholder for avatar URL>',
  iconUrl,
  grainUrl,
  behindGradient,
  innerGradient,
  showBehindGradient = true,
  className = '',
  enableTilt = true,
  miniAvatarUrl,
  showUserInfo = true,
  onContactClick
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [pointerX, setPointerX] = useState(50);
  const [pointerY, setPointerY] = useState(50);
  const [cardOpacity, setCardOpacity] = useState(0);
  
  const DEFAULT_BEHIND_GRADIENT = 
    'radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)';
  
  const DEFAULT_INNER_GRADIENT = 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)';
  
  const ANIMATION_CONFIG = {
    SMOOTH_DURATION: 600,
    INITIAL_DURATION: 1500,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60
  };

  // 工具函数
  const clamp = (value: number, min = 0, max = 100): number => Math.min(Math.max(value, min), max);
  const round = (value: number, precision = 3): number => parseFloat(value.toFixed(precision));
  const adjust = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number =>
    round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));
  
  // 更新卡片变换效果
  const updateCardTransform = (offsetX: number, offsetY: number) => {
    const card = cardRef.current;
    const wrap = wrapRef.current;
    
    if (!card || !wrap || !enableTilt) return;
    
    const width = card.clientWidth;
    const height = card.clientHeight;
    
    const percentX = clamp((100 / width) * offsetX);
    const percentY = clamp((100 / height) * offsetY);
    
    setPointerX(percentX);
    setPointerY(percentY);
    
    const centerX = percentX - 50;
    const centerY = percentY - 50;
    
    const properties = {
      '--pointer-x': `${percentX}%`,
      '--pointer-y': `${percentY}%`,
      '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
      '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
      '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
      '--pointer-from-top': `${percentY / 100}`,
      '--pointer-from-left': `${percentX / 100}`,
      '--rotate-x': `${round(-(centerX / 5))}deg`,
      '--rotate-y': `${round(centerY / 4)}deg`
    };
    
    Object.entries(properties).forEach(([property, value]) => {
      wrap.style.setProperty(property, value);
    });
  };
  
  // 处理鼠标移动事件
  const handlePointerMove = (event: React.PointerEvent) => {
    if (!enableTilt) return;
    
    const card = cardRef.current;
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    updateCardTransform(event.clientX - rect.left, event.clientY - rect.top);
  };
  
  // 处理鼠标进入事件
  const handlePointerEnter = () => {
    if (!enableTilt) return;
    
    setCardOpacity(1);
  };
  
  // 处理鼠标离开事件
  const handlePointerLeave = (event: React.PointerEvent) => {
    if (!enableTilt) return;
    
    // 重置到中心位置
    const card = cardRef.current;
    const wrap = wrapRef.current;
    
    if (!card || !wrap) return;
    
    const centerX = wrap.clientWidth / 2;
    const centerY = wrap.clientHeight / 2;
    
    updateCardTransform(centerX, centerY);
    setCardOpacity(0);
  };
  
  // 处理头像加载错误
  const handleAvatarError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = 'none';
  };
  
  // 处理迷你头像加载错误
  const handleMiniAvatarError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.opacity = '0.5';
    event.currentTarget.src = avatarUrl;
  };
  
  // 组件挂载时初始化
  useEffect(() => {
    if (!enableTilt) return;
    
    const card = cardRef.current;
    const wrap = wrapRef.current;
    
    if (!card || !wrap) return;
    
    // 添加事件监听器
    card.addEventListener('pointerenter', handlePointerEnter);
    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);
    
    // 初始位置设置
    const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    
    updateCardTransform(initialX, initialY);
    
    // 清理函数
    return () => {
      card.removeEventListener('pointerenter', handlePointerEnter);
      card.removeEventListener('pointermove', handlePointerMove);
      card.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [enableTilt]);
  
  // 设置卡片样式
  const cardStyle = {
    '--icon': iconUrl ? `url(${iconUrl})` : 'none',
    '--grain': grainUrl ? `url(${grainUrl})` : 'none',
    '--behind-gradient': showBehindGradient ? (behindGradient || DEFAULT_BEHIND_GRADIENT) : 'none',
    '--inner-gradient': innerGradient || DEFAULT_INNER_GRADIENT,
    '--card-opacity': cardOpacity
  };

  return (
    <div 
      ref={wrapRef} 
      className={cn("pc-card-wrapper", className)} 
      style={cardStyle}
    >
      <section ref={cardRef} className="pc-card">
        <div className="pc-inside">
          <div className="pc-shine" />
          <div className="pc-glare" />
          
          <div className="pc-content pc-avatar-content">
            <img
              className="avatar"
              src={avatarUrl}
              alt={`${name} avatar`}
              loading="lazy"
              onError={handleAvatarError}
            />
            
            {showUserInfo && (
              <div className="pc-user-info">
                <div className="pc-user-details">
                  <div className="pc-mini-avatar">
                    <img
                      src={miniAvatarUrl || avatarUrl}
                      alt={`${name} mini avatar`}
                      loading="lazy"
                      onError={handleMiniAvatarError}
                    />
                  </div>
                  
                  <div className="pc-user-text">
                    <div className="pc-handle">@{handle}</div>
                    <div className="pc-status">{status}</div>
                  </div>
                </div>
                
                <button
                  className="pc-contact-btn"
                  onClick={onContactClick}
                  style={{ pointerEvents: 'auto' }}
                  type="button"
                  aria-label={`Contact ${name}`}
                >
                  {contactText}
                </button>
              </div>
            )}
          </div>
          
          <div className="pc-content">
            <div className="pc-details">
              {/* 确保name有值，防止显示空白 */}
              <h3>{name || '导师姓名'}</h3>
              <p>{title}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

interface MentorsProps {
  canEdit?: boolean;
}

const Mentors = ({ canEdit = false }: MentorsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });

   // 导师数据
  const mentors: Mentor[] = [
    {
      id: 1,
      name: '张教授',
      title: '信息安全学院院长',
      description: '网络安全领域专家，拥有20年教学与研究经验，主要研究方向为网络攻防技术',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20professor%20male&sign=91106aa684ee6f1dfd5fe8aea8dfe872',
      status: '网络安全'
    },
    {
      id: 2,
      name: '李博士',
      title: '网络安全实验室主任',
      description: '密码学博士，主要研究方向为区块链安全和隐私保护技术，曾在国际期刊发表多篇论文',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20researcher%20male&sign=0b03c3b3ee79998da3d2419bab87839c',
      status: '密码学'
    },
    {
      id: 3,
      name: '王工程师',
      title: '企业特聘导师',
      description: '某知名安全公司技术总监，拥有丰富的实战经验，擅长渗透测试和漏洞挖掘',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20engineer%20male&sign=292f7a6820fe05d040bc64b4a9226946',
      status: '渗透测试'
    },
    {
      id: 4,
      name: '陈教授',
      title: '信息安全系主任',
      description: '网络安全教学专家，主要研究方向为网络安全协议和安全体系架构',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20professor%20female&sign=9d0a057f000f2d17fec90a498f991eed',
      status: '网络协议'
    },
    {
      id: 5,
      name: '刘博士',
      title: '特聘研究员',
      description: '云计算安全专家，曾参与多个国家级网络安全项目的研究与开发',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20researcher%20female&sign=f5acf569ee0975c52143ae1874cbabb1',
      status: '云计算安全'
    }
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '桃李导师',
      additionalProps: { 
        fontSize: 'clamp(1.5rem,3vw,2.5rem)', 
        fontWeight: 'bold',
        gradient: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'
      }
    },
    {
      id: 'description',
      type: 'text',
      content: '我们拥有一支由学术专家和行业精英组成的导师团队，为社团成员提供专业指导',
      additionalProps: { fontSize: '1rem', color: 'text-gray-500 dark:text-gray-400' }
    },
    ...mentors.map(mentor => ({
      id: `mentor-${mentor.id}`,
      type: 'card',
      name: mentor.name, // 导师名字
      title: mentor.title, // 导师职位
      handle: '内蒙古科技大学',
      status: mentor.status,
      contactText: '详细信息',
      imageUrl: mentor.imageUrl,
      description: mentor.description,
      additionalProps: {
        showBehindGradient: true,
        enableTilt: true,
        showUserInfo: true
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
    moduleId: 'mentors-section',
    initialElements,
    canEdit
  });

   // 处理联系按钮点击
  const handleContactClick = (mentorName: string, linkUrl?: string) => {
    toast(`正在连接${mentorName}教授...`);
    console.log(`Contact button clicked for ${mentorName}`);
    if (linkUrl) {
      window.location.href = linkUrl;
    }
  };

  // 检测元素是否在视口中
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // 设置卡片尺寸以便居中
          setTimeout(() => {
            const container = ref.current;
            if (container) {
              setCardDimensions({
                width: container.clientWidth * 0.4, // 根据需要调整
                height: container.clientHeight * 0.6 // 根据需要调整
              });
            }
          }, 100);
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
  }, []);

  // 下一个导师
  const nextMentor = () => {
    const mentorElements = elements.filter(el => el.id.startsWith('mentor-'));
    setCurrentIndex((prevIndex) => 
      prevIndex === mentorElements.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 上一个导师
  const prevMentor = () => {
    const mentorElements = elements.filter(el => el.id.startsWith('mentor-'));
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? mentorElements.length - 1 : prevIndex - 1
    );
  };

  // 计算轮播卡片的样式和位置
  const getCardStyles = (index: number) => {
    const mentorElements = elements.filter(el => el.id.startsWith('mentor-'));
    
    // 计算角度和距离
    const angle = ((index - currentIndex) / mentorElements.length) * Math.PI * 2;
    const radius = 300; // 轮播半径
    
    // 使中间的卡片居中显示，其他卡片分布在周围
    if (index === currentIndex) {
      return {
        opacity: 1,
        scale: 1,
        zIndex: 3,
        position: 'absolute' as const,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      };
    } else {
      // 计算左右两侧卡片的位置
      const left = 50 + (Math.sin(angle) * radius / (cardDimensions.width || 1)) * 100;
      const top = 50 + (Math.cos(angle) * radius / (cardDimensions.height || 1)) * 100;
      
      return {
        opacity: Math.abs(angle) < Math.PI / 2 ? 0.6 : 0,
        scale: 0.8,
        zIndex: 2,
        position: 'absolute' as const,
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)'
      };
    }
  };

   // 从元素中分离出不同类型的数据
  const titleElement = elements.find(el => el.id === 'title') || initialElements[0];
  const descriptionElement = elements.find(el => el.id === 'description') || initialElements[1];
  const mentorElements = elements.filter(el => el.id.startsWith('mentor-'));
  
  // 确保mentorElements至少有一个元素，防止渲染错误
  if (mentorElements.length === 0) {
    console.warn('No mentor elements found, using default');
  }

  return (
    <section 
      ref={ref} 
      className="py-20 bg-black/40 backdrop-blur-sm overflow-hidden min-h-[900px] cursor-pointer"
      onClick={handleModuleClick}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            className={`text-[clamp(1.5rem,3vw,2.5rem)] font-orbitron font-bold ${titleElement.additionalProps?.gradient || 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'} mb-4`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {titleElement.content}
          </motion.h2>
          <motion.p 
            className={`${descriptionElement.additionalProps?.color || 'text-gray-500 dark:text-gray-400'} max-w-2xl mx-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {descriptionElement.content}
          </motion.p>
        </div>

        {/* 轮播容器 */}
        <div className="relative h-[600px] flex items-center justify-center">
          {/* 轮播卡片 */}
          <div className="relative w-full h-full">
            <AnimatePresence>
              {mentorElements.map((mentor, index) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    ...getCardStyles(index)
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5 }}
                >
                     <ProfileCard
                    name={mentor.name || mentor.title || ''} // 确保正确显示名字
                    title={mentor.title || ''} // 确保正确显示职位
                    handle={mentor.handle || "内蒙古科技大学"}
                    status={mentor.status || ''}
                    contactText={mentor.contactText || "详细信息"}
                    avatarUrl={mentor.imageUrl || ''}
                    showBehindGradient={mentor.additionalProps?.showBehindGradient || true}
                    enableTilt={mentor.additionalProps?.enableTilt || true}
                     showUserInfo={mentor.additionalProps?.showUserInfo || true}
                    onContactClick={() => handleContactClick(mentor.name || mentor.title || '', mentor.linkUrl)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 左右箭头按钮 - 固定在两侧 */}
          <motion.button
            onClick={prevMentor}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shadow-lg hover:bg-white/30 transition-all z-20"
            aria-label="上一个导师"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fa-solid fa-chevron-left text-xl"></i>
          </motion.button>
          
          <motion.button
            onClick={nextMentor}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shadow-lg hover:bg-white/30 transition-all z-20"
            aria-label="下一个导师"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fa-solid fa-chevron-right text-xl"></i>
          </motion.button>
        </div>

        {/* 指示器 */}
        <div className="flex justify-center mt-12 space-x-3">
          {mentorElements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentIndex === index ? 'w-12 bg-primary-blue' : 'bg-white/50'
              }`}
              aria-label={`切换到第 ${index + 1} 位导师`}
            ></button>
          ))}
        </div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
         moduleName="桃李导师"
         elements={elements}
         onUpdateElements={updateElements}
         moduleType="mentor"
         supportsAddDelete={true}
      />
    </section>
  );
};

export default Mentors;