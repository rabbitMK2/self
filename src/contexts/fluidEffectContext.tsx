import { createContext, useState, useEffect, ReactNode } from "react";

// 定义上下文类型
interface FluidEffectContextType {
  isEnabled: boolean;
  toggleEnabled: () => void;
}

// 创建上下文，设置默认值
export const FluidEffectContext = createContext<FluidEffectContextType>({
  isEnabled: true,
  toggleEnabled: () => {},
});

// 定义Provider组件Props类型
interface FluidEffectProviderProps {
  children: ReactNode;
}

// 实现Provider组件
export const FluidEffectProvider: React.FC<FluidEffectProviderProps> = ({ children }) => {
  // 从localStorage中获取保存的状态，如果没有则默认为true
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const savedState = localStorage.getItem('fluidEffectEnabled');
    return savedState === null ? true : JSON.parse(savedState);
  });
  
  // 当isEnabled状态变化时，保存到localStorage
  useEffect(() => {
    localStorage.setItem('fluidEffectEnabled', JSON.stringify(isEnabled));
  }, [isEnabled]);
  
  // 切换启用状态的函数
  const toggleEnabled = () => {
    setIsEnabled(prev => !prev);
  };
  
  // 上下文值
  const contextValue: FluidEffectContextType = {
    isEnabled,
    toggleEnabled,
  };
  
  return (
    <FluidEffectContext.Provider value={contextValue}>
      {children}
    </FluidEffectContext.Provider>
  );
};