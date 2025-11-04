import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import useModuleEditor from '@/hooks/useModuleEditor';
import ModuleEditorModal, { ModuleElement } from '@/components/ModuleEditorModal';

// 团队荣誉类型定义
interface HonorImage {
  id: number;
  url: string;
  title: string;
  year: string;
}

interface TeamHonorsProps {
  className?: string;
  containerClass?: string;
  width?: number;
  height?: number;
}

interface TeamHonorsExtendedProps extends TeamHonorsProps {
  canEdit?: boolean;
}

const TeamHonors: React.FC<TeamHonorsExtendedProps> = ({
  className = '',
  containerClass = '',
  width = 450,
  height = 600,
  canEdit = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(50, 1, 1, 5000)
  );
  const rendererRef = useRef<CSS3DRenderer | null>(null);
  const carouselRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const radiusRef = useRef<number>(750);
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const sensitivity = 0.0025;
  
  // 动画相关
  const animationRef = useRef<number | null>(null);
  const sceneNeedsUpdate = useRef(false);
  
  // 团队荣誉数据
  const honorImages: HonorImage[] = [
    {
      id: 1,
      url: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=cybersecurity%20team%20award%20ceremony&sign=61c6650f3f49df30f910aafc1e55ea5f',
      title: '全国网络安全竞赛一等奖',
      year: '2024'
    },
    {
      id: 2,
      url: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=student%20cybersecurity%20team%20with%20trophy&sign=7ad7e1300fb39415ed43e837d2dcd1fc',
      title: '自治区信息安全挑战赛冠军',
      year: '2023'
    },
    {
      id: 3,
      url: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=cybersecurity%20hackathon%20winner%20team&sign=7b1d79c1626e875526f5cc716fa21623',
      title: '高校网络安全攻防演练最佳团队',
      year: '2023'
    },
    {
      id: 4,
      url: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=cybersecurity%20conference%20certificate%20award&sign=3f37e409c453b4d3dbd9bb43a28e36dc',
      title: '网络安全创新项目金奖',
      year: '2022'
    },
    {
      id: 5,
      url: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=student%20team%20receiving%20cybersecurity%20award&sign=a3d76843449bd8becfd05e2e8bddee68',
      title: '优秀网络安全社团',
      year: '2022'
    },
    {
      id: 6,
      url: 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=cybersecurity%20education%20excellence%20award&sign=bad9b53c06cee13905d3414858742134',
      title: '网络安全教育优秀实践基地',
      year: '2021'
    }
  ];

  // 初始化模块编辑功能
  const initialElements: ModuleElement[] = [
    {
      id: 'title',
      type: 'text',
      content: '团队荣誉',
      additionalProps: { fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 'bold' }
    },
    {
      id: 'description',
      type: 'text',
      content: '展示内蒙古科技大学网络安全社团在各类竞赛和活动中取得的荣誉成就',
      additionalProps: { fontSize: '1rem', color: 'text-gray-500 dark:text-gray-400' }
    },
    ...honorImages.map(image => ({
      id: `honor-${image.id}`,
      type: 'card',
      title: image.title,
      description: image.year,
      imageUrl: image.url,
      additionalProps: { 
        type: 'honor'
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
    moduleId: 'team-honors-section',
    initialElements,
    canEdit
  });

   // 更新3D场景
  useEffect(() => {
    if (!containerRef.current || !rendererRef.current) return;
    
    const honorElements = elements.filter(el => el.id.startsWith('honor-'));
    
    // 确保至少有默认数据显示
    const displayElements = honorElements.length > 0 ? honorElements : initialElements.filter(el => el.id.startsWith('honor-'));
    
    // 清空当前的carousel
    const carousel = carouselRef.current;
    while (carousel.children.length > 0) {
      const child = carousel.children[0];
      carousel.remove(child);
    }
    
    // 添加新的荣誉图片
    displayElements.forEach((image, index) => {
      const element = document.createElement('div');
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      element.classList.add('rounded-lg', 'overflow-hidden', 'shadow-xl');
      
      // 创建图片容器
      const imgContainer = document.createElement('div');
      imgContainer.style.width = '100%';
      imgContainer.style.height = '100%';
      imgContainer.style.position = 'relative';
      
      // 添加图片
      const img = document.createElement('img');
      img.src = image.imageUrl || 'https://space.coze.cn/api/coze_space/gen_image?image_size=portrait_4_3&prompt=cybersecurity%20team%20award%20ceremony&sign=61c6650f3f49df30f910aafc1e55ea5f';
      img.alt = image.title || '团队荣誉';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      
      // 添加覆盖层
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.bottom = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.padding = '20px';
      overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)';
      overlay.style.color = 'white';
      
      // 添加标题
      const title = document.createElement('h3');
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.margin = '0';
      title.textContent = image.title || '团队荣誉';
      
      // 添加年份
      const year = document.createElement('div');
      year.style.position = 'absolute';
      year.style.top = '20px';
      year.style.right = '20px';
      year.style.width = '50px';
      year.style.height = '50px';
      year.style.borderRadius = '50%';
      year.style.background = 'linear-gradient(135deg, #1a73e8, #4285f4)';
      year.style.color = 'white';
      year.style.display = 'flex';
      year.style.alignItems = 'center';
      year.style.justifyContent = 'center';
      year.style.fontWeight = 'bold';
      year.textContent = image.description || '2024';
      
      // 组装元素
      overlay.appendChild(title);
      imgContainer.appendChild(img);
      imgContainer.appendChild(overlay);
      imgContainer.appendChild(year);
      element.appendChild(imgContainer);

      // 创建3D对象并添加到carousel
      const object = new CSS3DObject(element);
      const angle = (index / displayElements.length) * Math.PI * 2;
      object.position.setFromSphericalCoords(radiusRef.current, Math.PI / 2, angle);
      object.lookAt(carousel.position);

      carousel.add(object);
    });
    
    sceneNeedsUpdate.current = true;
    
    // 立即渲染一次以确保内容显示
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    rendererRef.current.render(scene, camera);
  }, [elements, width, height, initialElements]);

  // 初始化3D场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 设置渲染器
    rendererRef.current = new CSS3DRenderer();
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    rendererRef.current.setSize(containerWidth, containerHeight);
    container.appendChild(rendererRef.current.domElement);

    // 设置相机
    const camera = cameraRef.current;
    camera.position.z = 550;
    camera.position.y = 70;

    // 添加carousel到场景
    const scene = sceneRef.current;
    const carousel = carouselRef.current;
    scene.add(carousel);

    // 初始旋转角度
    carousel.rotation.x = THREE.MathUtils.degToRad(20);
    
    // 开始自动旋转
    startContinuousRotation();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      radiusRef.current = newWidth / 3;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
      
      // 重新渲染
      rendererRef.current.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 开始自动旋转
  const startContinuousRotation = () => {
    const carousel = carouselRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    
    if (!renderer) return;
    
    let startTime: number | null = null;
    const duration = 20000; // 20秒完成一圈
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      carousel.rotation.y = progress * Math.PI * 2;
      renderer.render(scene, camera);
      
      if (!isDragging) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // 处理拖拽开始
  const handleDragStart = (event: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    setStartX(clientX);
    setCurrentX(clientX);
    
    // 停止自动旋转动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
    // 重新开始自动旋转
    startContinuousRotation();
  };

  // 处理鼠标移动
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    handleDrag(event.clientX);
  };

  // 处理触摸移动
  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDragging) return;
    event.preventDefault();
    handleDrag(event.touches[0].clientX);
  };

  // 处理拖拽
  const handleDrag = (clientX: number) => {
    const deltaX = clientX - currentX;
    setCurrentX(clientX);
    
    const carousel = carouselRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    
    if (!renderer) return;
    
    carousel.rotation.y += -deltaX * sensitivity;
    renderer.render(scene, camera);
  };

  // 从元素中分离出不同类型的数据
  const titleElement = elements.find(el => el.id === 'title') || initialElements[0];
  const descriptionElement = elements.find(el => el.id === 'description') || initialElements[1];

  return (
     <section 
       className={cn("py-20 bg-black/40 backdrop-blur-sm overflow-hidden cursor-pointer", className)}
       onClick={handleModuleClick}
     >
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-orbitron font-bold text-gray-800 dark:text-white mb-4">
            {titleElement.content}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {descriptionElement.content}
          </p>
        </motion.div>

        <div 
          ref={containerRef}
          className={cn("w-full h-[60vh] relative", containerClass)}
        >
          <div
            className={cn("absolute top-[40%] translate-y-[-50%] left-0 w-full h-[80%] z-[100]", className)}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onMouseMove={handleMouseMove}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onTouchMove={handleTouchMove}
          ></div>
        </div>

        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            拖动可以旋转查看更多荣誉 | Drag to rotate and view more honors
          </p>
        </motion.div>
      </div>

      {/* 模块编辑弹窗 */}
      <ModuleEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        moduleName="团队荣誉"
        elements={elements}
        onUpdateElements={updateElements}
        moduleType="honor"
        supportsAddDelete={false}
      />
    </section>
  );
};

export default TeamHonors;