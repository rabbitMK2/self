import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import NewsSection from '@/components/NewsSection';
import Timeline from '@/components/Timeline';
import Achievements from '@/components/Achievements';
import TeamHonors from '@/components/TeamHonors';
import Mentors from '@/components/Mentors';
import Platforms from '@/components/Platforms';
import Footer from '@/components/Footer';
import ClubIntroduction from '@/components/ClubIntroduction';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

interface HomeProps {
  canEdit?: boolean;
}

export default function Home({ canEdit = false }: HomeProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Logo编辑功能
  const {
    elements: logoElements,
    isModalOpen: logoModalOpen,
    openModal: openLogoModal,
    closeModal: closeLogoModal,
    updateElements: updateLogoElements,
    handleModuleClick: handleLogoClick
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

  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen text-gray-100 overflow-auto">
      <Header isScrolled={isScrolled} canEdit={canEdit} />
      
      <main className="pt-16">
        <Carousel canEdit={canEdit} />
        <NewsSection canEdit={canEdit} />
        <Timeline canEdit={canEdit} />
        <Achievements canEdit={canEdit} />
        <ClubIntroduction canEdit={canEdit} />
        <TeamHonors canEdit={canEdit} />
        <Mentors canEdit={canEdit} />
        <Platforms canEdit={canEdit} />
      </main>
      
      <Footer />

      {/* Logo编辑弹窗 */}
      <ModuleEditorModal
        isOpen={logoModalOpen}
        onClose={closeLogoModal}
        moduleName="网站Logo"
        elements={logoElements}
        onUpdateElements={updateLogoElements}
        moduleType="logo"
        onlyModify={true}
      />
    </div>
  );
}