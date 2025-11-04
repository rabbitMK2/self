import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 打字机效果组件
const TypewriterText: React.FC<{ text: string; className?: string; speed?: number }> = ({ 
  text, 
  className = '', 
  speed = 20 // 每个字符显示的毫秒数
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);
  
  return <span className={className}>{displayedText}</span>;
};

interface ClubIntroductionProps {
  canEdit?: boolean;
}

// 社团介绍模块组件
const ClubIntroduction = ({ canEdit = false }: ClubIntroductionProps) => {
  // 状态管理，使用数组记录所有激活的对话气泡，允许多个同时显示
  const [activeSections, setActiveSections] = useState<string[]>([]);
  
  // 社团信息数据
  const clubInfo = {
    intro: {
      question: "你好，我想了解一下内蒙古科技大学网络安全社团的基本情况，包括成立时间、规模和主要活动内容。",
      content: "内蒙古科技大学网络安全社团成立于2020年，是由在校网络安全爱好者自发组织的学生社团。社团致力于网络安全知识的学习、研究与普及，定期举办技术讲座、安全培训和CTF竞赛等活动。目前社团拥有成员80余名，涵盖计算机科学与技术、网络工程、信息安全等多个专业的本科生和研究生。"
    },
    structure: {
      question: "社团的组织结构是怎样的？我想了解一下社团有哪些部门，以及各个部门的主要职责。",
      content: "社团下设技术部、宣传部、组织部和培训部四个部门。技术部负责技术研究和竞赛指导；宣传部负责社团形象建设和活动宣传；组织部负责活动策划和组织实施；培训部负责新成员培训和学习资源管理。社团设社长1名，副社长2名，各部门设部长1名，副部长2名。"
    },
    rules: {
      question: "作为社团成员，需要遵守哪些规章制度呢？有没有特别需要注意的地方？",
      content: "社团成员需遵守以下规章制度：1. 遵守国家法律法规和学校规章制度；2. 尊重师长，团结同学，维护社团形象；3. 积极参加社团活动，完成社团分配的任务；4. 保守社团技术机密，不对外泄露；5. 按时缴纳会费，用于社团日常开支；6. 不得利用社团资源从事违法活动。违反规章制度者，视情节轻重给予警告、劝退或除名处理。"
    }
  };
  
  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '社团介绍',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    {
      id: 'description',
      type: 'text',
      content: '了解内蒙古科技大学网络安全社团的基本情况、组织结构和规章制度',
      additionalProps: { fontSize: '1rem', color: 'text-gray-300' }
    },
    ...Object.entries(clubInfo).map(([key, info]) => ({
      id: `qa-${key}`,
      type: 'card',
      title: info.question,
      description: info.content,
      additionalProps: { type: 'qa' }
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
    moduleId: 'club-introduction-section',
    initialElements,
    canEdit
  });
  
  // 切换激活的对话气泡
  const toggleSection = (section: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setActiveSections(prevSections => 
      prevSections.includes(section)
        ? prevSections.filter(s => s !== section)
        : [...prevSections, section]
    );
  };
  
  // 动画变体
  const bubbleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const replyVariants = {
    hidden: { opacity: 0, y: 20, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0,
      height: "auto",
      transition: { duration: 0.4 }
    }
  };

  // 渲染所有对话项
  const renderConversation = () => {
    const items = [];
    
    const qaElements = elements.filter(el => el.id.startsWith('qa-'));
    
    qaElements.forEach((qa, index) => {
      // 添加问题气泡（右侧）
       items.push(
        <motion.div 
          key={`question-${qa.id}`}
          className="flex justify-end mb-4 cursor-pointer"
          variants={bubbleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          onClick={(e) => toggleSection(qa.id, e)}
        >
          {/* 使用flex-end布局确保用户头像和气泡正确对齐 */}
          <div className="flex items-start gap-3">
            {/* 问题气泡 */}
            <div className={`relative max-w-[70%] p-5 rounded-2xl border-2 border-emerald-500 bg-black/40 backdrop-blur-lg transition-all duration-300 hover:bg-emerald-900/20 ${activeSections.includes(qa.id) ? 'bg-emerald-900/30' : ''}`}>
              <div className="absolute -right-4 top-6 w-4 h-4 border-r-2 border-t-2 border-emerald-500 bg-black/40 transform rotate-45"></div>
              <p className="text-emerald-400 leading-relaxed">{qa.title}</p>
            </div>
            
            {/* 用户头像 - 使用固定的尺寸和定位，确保与回复头像对齐 */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 flex-shrink-0 mt-2">
              <img 
                src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=student%20avatar%20generic&sign=b9d7ff56c7ef2b4217971774f970270e" 
                alt="用户头像" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      );
      
      // 添加回复气泡（如果当前问题激活）
      if (activeSections.includes(qa.id)) {
        items.push(
          <AnimatePresence key={`reply-${qa.id}`}>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={replyVariants}
              className="mb-4"
            >
              {/* 使用flex-start布局确保回复头像和气泡正确对齐 */}
              <div className="flex items-start gap-3">
                {/* 社团LOGO头像 - 与用户头像使用相同的尺寸和定位 */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-blue flex-shrink-0 mt-2">
                  <img 
                    src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20shield%20logo%20tech%20future%20blue%20glow&sign=3833687881cc4234790bc8de64fca621" 
                    alt="社团LOGO" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                 {/* 回复气泡 */}
                 <div className="relative max-w-[70%] p-5 rounded-2xl border-2 border-blue-500 bg-black/40 backdrop-blur-lg">
                  {/* 修正箭头方向和位置为向左指向头像 */}
                   <div className="absolute -left-4 top-6 w-4 h-4 border-l-2 border-t-2 border-blue-500 bg-black/40 transform -rotate-45"></div>
                  {/* 使用打字机效果组件 */}
                  <TypewriterText 
                    text={qa.description} 
                    className="text-blue-400 leading-relaxed" 
                    speed={15} 
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        );
      }
    });
    
    return items;
  };

  // 从元素中分离出不同类型的数据
  const titleElement = elements.find(el => el.id === 'title') || initialElements[0];
  const descriptionElement = elements.find(el => el.id === 'description') || initialElements[1];

  return (
    <section 
      className="py-20 bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={handleModuleClick}
    >
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-orbitron font-bold text-white mb-4">
            {titleElement.content}
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {descriptionElement.content}
          </p>
        </motion.div>
        
        <div className="max-w-3xl mx-auto">
          {/* 对话气泡区域 */}
          <div className="space-y-2">
            {renderConversation()}
          </div>
        </div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        moduleName="社团介绍"
        elements={elements}
        onUpdateElements={updateElements}
        moduleType="qa"
        supportsAddDelete={true}
      />
    </section>
  );
};

export default ClubIntroduction;