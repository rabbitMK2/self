import { useState, useRef, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { FluidEffectContext } from '@/contexts/fluidEffectContext.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal from '@/components/ModuleEditorModal';

interface HeaderProps {
  isScrolled: boolean;
  canEdit?: boolean;
}

// 导航菜单项类型定义
interface NavItem {
  label: string;
  href: string;
  subItems?: {
    label: string;
    href: string;
  }[];
}

const Header = ({ isScrolled, canEdit = false }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, setIsAuthenticated, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDropdown, setCurrentDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { isEnabled, toggleEnabled } = useContext(FluidEffectContext);

  // Logo编辑功能
  const {
    elements: logoElements,
    isModalOpen,
    openModal,
    closeModal,
    updateElements,
    handleModuleClick
  } = useModuleEditor({
    moduleId: 'header-logo',
    initialElements: [{
      id: 'logo',
      type: 'image',
      imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20shield%20logo%20tech%20future%20blue%20glow&sign=3833687881cc4234790bc8de64fca621',
      content: '内蒙古科技大学网安协会'
    }],
    canEdit
  });

  // 显示LOGO编辑弹窗
  const showLogoEditor = () => {
    openModal();
  };

  // 导航菜单数据 - 移除了"首页"和"排行榜"
  const navItems: NavItem[] = [
    {
      label: '社团介绍',
      href: '/about',
      subItems: [
        { label: '社团简介', href: '/about/intro' },
        { label: '组织结构', href: '/about/structure' },
        { label: '社团章程', href: '/about/constitution' },
      ],
    },
    {
      label: '就业信息',
      href: '/career',
      subItems: [
        { label: '行业动态', href: '/career/news' },
        { label: '招聘信息', href: '/career/jobs' },
        { label: '校友风采', href: '/career/alumni' },
      ],
    },
  ];

  // 处理登录按钮点击
  const handleLogin = () => {
    if (isAuthenticated) {
      logout();
      toast('已退出登录');
    } else {
      // 模拟登录
      setIsAuthenticated(true);
      toast('登录成功');
    }
  };

  // 处理注册按钮点击
  const handleRegister = () => {
    toast('注册功能即将上线');
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let isClickInsideDropdown = false;
      
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target as Node)) {
          isClickInsideDropdown = true;
        }
      });
      
      if (!isClickInsideDropdown) {
        setCurrentDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md shadow-md py-2' 
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
             {/* Logo区域 */}
            <div className={`flex items-center ${canEdit ? 'cursor-pointer' : ''}`} onClick={canEdit ? showLogoEditor : undefined}>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-blue mr-3 flex-shrink-0">
                <img 
                  src={logoElements[0]?.imageUrl || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20shield%20logo%20tech%20future%20blue%20glow&sign=3833687881cc4234790bc8de64fca621'} 
                  alt="社团LOGO" 
                  className="w-full h-full object-cover"
                />
              </div>
                <h1 className="text-[clamp(24px,2.4vw,32px)] font-orbitron font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent ml-2 whitespace-nowrap">
                   {logoElements[0]?.content || '内蒙古科技大学网安协会'}
                 </h1>
            </div>

            {/* Logo编辑弹窗 */}
            <ModuleEditorModal
              isOpen={isModalOpen}
              onClose={closeModal}
              moduleName="网站Logo"
              elements={logoElements}
              onUpdateElements={updateElements}
              moduleType="logo"
              onlyModify={true}
            />

           {/* 桌面导航菜单 */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto">
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.subItems ? (
                  <>
                     <button
                      className="flex items-center text-white hover:text-primary-blue transition-colors font-medium"
                      onClick={() => setCurrentDropdown(currentDropdown === item.label ? null : item.label)}
                    >
                      {item.label}
                      <i className="fa-solid fa-chevron-down ml-1 text-xs transition-transform duration-200" 
                        style={{ transform: currentDropdown === item.label ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>
                    
                    <AnimatePresence>
                      {currentDropdown === item.label && (
                        <motion.div
                          ref={(el) => (dropdownRefs.current[item.label] = el)}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50"
                        >
                          {item.subItems.map((subItem) => (
                            <a
                              key={subItem.label}
                              href={subItem.href}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-light-blue dark:hover:bg-gray-700 transition-colors"
                              onClick={() => setCurrentDropdown(null)}
                            >
                              {subItem.label}
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                   <a
                    href={item.href}
                    className="text-white hover:text-primary-blue transition-colors font-medium"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </nav>

            {/* 用户操作区 */}
          <div className="flex items-center space-x-4 ml-6">
    {/* 流体效果开关按钮 - 科技感设计 */}
    <div className="relative group">
      <motion.button
        onClick={toggleEnabled}
        className={`relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out ${
          isEnabled ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-700'
        }`}
        aria-label={isEnabled ? "关闭流体效果" : "开启流体效果"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 滑块 */}
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
          animate={{
            x: isEnabled ? 24 : 0,
            backgroundColor: isEnabled ? "#ffffff" : "#d1d5db"
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {isEnabled ? (
            <i className="fa-solid fa-droplet text-xs text-blue-500"></i>
          ) : (
            <i className="fa-regular fa-droplet text-xs text-gray-500"></i>
          )}
        </motion.div>
        
        {/* 发光效果 */}
        <span
          className={`absolute inset-0 rounded-full blur-md opacity-70 ${
            isEnabled ? 'bg-cyan-400' : 'opacity-0'
          }`}
        ></span>
      </motion.button>
      
      {/* 悬停提示 */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isEnabled ? "关闭流体效果" : "开启流体效果"}
      </div>
    </div>

            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-colors"
              aria-label="切换主题"
            >
              {theme === 'light' ? (
                <i className="fa-solid fa-moon"></i>
              ) : (
                <i className="fa-solid fa-sun"></i>
              )}
            </button>

              {/* 移除了登录和注册按钮 */}

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="打开菜单"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </div>

       {/* 移动端导航菜单 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-t border-gray-800"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <div key={item.label} className="py-2">
                    <div className="flex items-center justify-between">
                       <a
                        href={item.href}
                        className="text-white font-medium"
                      >
                        {item.label}
                      </a>
                      {item.subItems && (
                        <button className="text-gray-500 dark:text-gray-400">
                          <i className="fa-solid fa-chevron-down text-xs"></i>
                        </button>
                      )}
                    </div>
                    {item.subItems && (
                      <div className="pl-4 mt-2 flex flex-col space-y-2">
                        {item.subItems.map((subItem) => (
                             <a
                              key={subItem.label}
                              href={subItem.href}
                              className="text-sm text-gray-300"
                            >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
         {/* 移除了移动端的登录和注册按钮 */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;