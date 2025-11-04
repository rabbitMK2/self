import React, { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// 定义组件属性接口
interface LampEffectProps {
  delay?: number;
  duration?: number;
  className?: string;
  children?: React.ReactNode;
}

const LampEffect: React.FC<LampEffectProps> = ({
  delay = 0.5,
  duration = 0.8,
  className = '',
  children
}) => {
  // 计算动画持续时间和延迟（以秒为单位）
  const durationInSeconds = `${duration}s`;
  const delayInSeconds = `${delay}s`;

  // 构建动态样式对象
  const animationStyles = {
    '--duration': durationInSeconds,
    '--delay': delayInSeconds
  } as CSSProperties;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden w-full h-full z-0',
        className,
      )}
      style={animationStyles}
    >
      {/* 发光背景层 - 增强底部栏的发光效果 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 via-blue-900/30 to-purple-900/30"></div>
      </div>
      
      {/* 增强的光效元素 */}
      <div className="relative isolate z-0 flex w-full flex-1 items-center justify-center overflow-hidden">
        {/* 左侧圆锥渐变 - 调整为从上方投射到整个底部 */}
        <div
          className="animate-conic-gradient-left bg-gradient-conic absolute top-0 left-0 h-full w-1/2 overflow-visible from-cyan-500 via-blue-500/60 to-transparent opacity-70 [--conic-position:from_0deg_at_top_left]"
        >
          {/* 移除了右侧的黑色遮罩，让光效自然扩散 */}
        </div>

        {/* 右侧圆锥渐变 - 调整为从上方投射到整个底部 */}
        <div
          className="animate-conic-gradient-right bg-gradient-conic absolute top-0 right-0 h-full w-1/2 overflow-visible from-transparent via-blue-500/60 to-purple-500 opacity-70 [--conic-position:from_180deg_at_top_right]"
        >
          {/* 移除了右侧的黑色遮罩，让光效自然扩散 */}
        </div>

        {/* 中心发光效果 - 增强亮度和覆盖范围 */}
        <div
          className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-cyan-400/40 via-blue-500/30 to-transparent blur-3xl"
        ></div>
        
        {/* 底部发光条带 - 作为底部栏的上边缘 */}
        <div 
          className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-cyan-400/70 via-blue-500/50 to-transparent blur-2xl"
        ></div>

        {/* 增强中心光晕 */}
        <div
          className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[30rem] h-[15rem] rounded-full bg-gradient-blue opacity-60 blur-3xl"
        ></div>

        {/* 聚光灯 - 调整位置和大小，使其更好地融入底部栏 */}
        <div
          className="animate-spotlight absolute top-8 left-1/2 transform -translate-x-1/2 h-40 w-40 rounded-full bg-cyan-400/70 blur-2xl"
        ></div>

        {/* 发光线条 - 作为底部栏的上边缘 */}
        <div
          className="animate-glowing-line absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
        ></div>
        
        {/* 底部光效层次 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/70 to-transparent"></div>
      </div>

      {children && (
        <div className="relative z-50 flex flex-col items-center px-5">
          {children}
        </div>
      )}
    </div>
  );
}

export default LampEffect;