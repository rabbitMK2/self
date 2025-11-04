import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { useState } from "react";
import { AuthContext } from '@/contexts/authContext';
import { Empty } from "@/components/Empty";
import Vortex from "@/components/Vortex";
import FluidCursor from "@/components/FluidCursor";
import { FluidEffectProvider, FluidEffectContext } from '@/contexts/fluidEffectContext.tsx';
import { useContext } from 'react';

// 定义路由组件
const AboutPage = () => <Empty />;
const CareerPage = () => <Empty />;
const RankingsPage = () => <Empty />;
const NewsPage = () => <Empty />;
const AchievementsPage = () => <Empty />;
const MentorsPage = () => <Empty />;
const PlatformsPage = () => <Empty />;

// 流体效果包装组件
const FluidBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isEnabled } = useContext(FluidEffectContext);
  
  return (
    <>
      <Vortex 
        backgroundColor="black"
        baseHue={220}
        particleCount={1000}
        baseSpeed={0.5}
        rangeSpeed={2}
        baseRadius={1.5}
        rangeRadius={3}
      >
        {children}
      </Vortex>
      {isEnabled && <FluidCursor />}
    </>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <FluidEffectProvider>
      <AuthContext.Provider
        value={{ isAuthenticated, setIsAuthenticated, logout }}
      >
        <Routes>
          <Route path="/" element={<FluidBackground><Home canEdit={false} /></FluidBackground>} />
          <Route path="/admin" element={<FluidBackground><Home canEdit={true} /></FluidBackground>} />
          <Route path="/about" element={<FluidBackground><AboutPage /></FluidBackground>} />
          <Route path="/career" element={<FluidBackground><CareerPage /></FluidBackground>} />
          <Route path="/rankings" element={<FluidBackground><RankingsPage /></FluidBackground>} />
          <Route path="/news" element={<FluidBackground><NewsPage /></FluidBackground>} />
          <Route path="/achievements" element={<FluidBackground><AchievementsPage /></FluidBackground>} />
          <Route path="/mentors" element={<FluidBackground><MentorsPage /></FluidBackground>} />
          <Route path="/platforms" element={<FluidBackground><PlatformsPage /></FluidBackground>} />
          <Route path="*" element={<FluidBackground><Empty /></FluidBackground>} />
        </Routes>
      </AuthContext.Provider>
    </FluidEffectProvider>
  );
}
