import { useRef, useEffect } from 'react';
import { createNoise3D } from 'simplex-noise';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// 定义常量
const TAU = 2 * Math.PI;
const BASE_TTL = 50;
const RANGE_TTL = 150;
const PARTICLE_PROP_COUNT = 9;
const RANGE_HUE = 100;
const NOISE_STEPS = 3;
const X_OFF = 0.00125;
const Y_OFF = 0.00125;
const Z_OFF = 0.0005;

// 定义组件属性接口
interface VortexProps {
  class?: string;
  containerClass?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
  children?: React.ReactNode;
}

// 防抖函数
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: number;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func.apply(this, args), delay);
  };
};

const Vortex: React.FC<VortexProps> = ({
  class: className = '',
  containerClass = '',
  particleCount = 1000,
  rangeY = 200,
  baseSpeed = 0.5,
  rangeSpeed = 2,
  baseRadius = 1.5,
  rangeRadius = 3,
  baseHue = 220,
  backgroundColor = '#000000',
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 使用useRef代替useState存储可变数据，避免不必要的重渲染
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlePropsRef = useRef<Float32Array | null>(null);
  const centerRef = useRef<[number, number]>([0, 0]);
  const animationFrameRef = useRef<number | null>(null);
  const tickRef = useRef(0);
  
  // 创建噪声生成器
  const noise3D = createNoise3D();
  
  // 工具函数
  const rand = (n: number): number => {
    return n * Math.random();
  };
  
  const randRange = (n: number): number => {
    return n - rand(2 * n);
  };
  
  const fadeInOut = (t: number, m: number): number => {
    const hm = 0.5 * m;
    return Math.abs(((t + hm) % m) - hm) / hm;
  };
  
  const lerp = (n1: number, n2: number, speed: number): number => {
    return (1 - speed) * n1 + speed * n2;
  };
  
  // 初始化粒子
  const initParticle = (i: number, props: Float32Array, canvas: HTMLCanvasElement) => {
    const x = rand(canvas.width);
    const y = centerRef.current[1] + randRange(rangeY);
    const vx = 0;
    const vy = 0;
    const life = 0;
    const ttl = BASE_TTL + rand(RANGE_TTL);
    const speed = baseSpeed + rand(rangeSpeed);
    const radius = baseRadius + rand(rangeRadius);
    const hue = baseHue + rand(RANGE_HUE);
    
    props.set(
      [x, y, vx, vy, life, ttl, speed, radius, hue],
      i
    );
  };
  
  // 绘制函数
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const particleProps = particlePropsRef.current;
    
    if (!canvas || !ctx || !particleProps) {
      animationFrameRef.current = requestAnimationFrame(draw);
      return;
    }
    
    // 增加tick计数
    tickRef.current++;
    
    // 清空画布
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新并绘制所有粒子
    for (let i = 0; i < particleProps.length; i += PARTICLE_PROP_COUNT) {
      const x = particleProps[i];
      const y = particleProps[i + 1];
      const vx = particleProps[i + 2];
      const vy = particleProps[i + 3];
      const life = particleProps[i + 4];
      const ttl = particleProps[i + 5];
      const speed = particleProps[i + 6];
      const radius = particleProps[i + 7];
      const hue = particleProps[i + 8];
      
      const n =
        noise3D(x * X_OFF, y * Y_OFF, tickRef.current * Z_OFF) *
        NOISE_STEPS *
        TAU;
      
      const nextVx = lerp(vx, Math.cos(n), 0.5);
      const nextVy = lerp(vy, Math.sin(n), 0.5);
      const nextX = x + nextVx * speed;
      const nextY = y + nextVy * speed;
      
      // 绘制粒子轨迹
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = radius;
      ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(
        life,
        ttl
      )})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();
      ctx.restore();
      
      // 更新粒子位置和状态
      particleProps[i] = nextX;
      particleProps[i + 1] = nextY;
      particleProps[i + 2] = nextVx;
      particleProps[i + 3] = nextVy;
      particleProps[i + 4] = life + 1;
      
      // 检查是否需要重新初始化粒子
      if (
        nextX > canvas.width ||
        nextX < 0 ||
        nextY > canvas.height ||
        nextY < 0 ||
        life > ttl
      ) {
        initParticle(i, particleProps, canvas);
      }
    }
    
    // 应用模糊效果增强视觉效果
    ctx.save();
    ctx.filter = 'blur(8px) brightness(200%)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.filter = 'blur(4px) brightness(200%)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
    
    // 继续下一帧动画
    animationFrameRef.current = requestAnimationFrame(draw);
  };
  
  // 处理窗口大小调整
  const handleResize = debounce(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    centerRef.current = [0.5 * canvas.width, 0.5 * canvas.height];
  }, 150);
  
  // 组件挂载时初始化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    ctxRef.current = context;
    
    // 设置Canvas尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerRef.current = [0.5 * canvas.width, 0.5 * canvas.height];
    
    // 初始化粒子数组
    const propsLength = particleCount * PARTICLE_PROP_COUNT;
    const props = new Float32Array(propsLength);
    
    // 初始化所有粒子
    for (let i = 0; i < propsLength; i += PARTICLE_PROP_COUNT) {
      initParticle(i, props, canvas);
    }
    
    particlePropsRef.current = props;
    
    // 开始绘制动画
    animationFrameRef.current = requestAnimationFrame(draw);
    
    // 添加窗口大小调整事件监听
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particleCount, rangeY, baseSpeed, rangeSpeed, baseRadius, rangeRadius, baseHue, backgroundColor]);
  
  return (
    <>
      {/* 背景层 - 固定定位但不影响内容滚动 */}
      <div className="fixed inset-0 z-[-1]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
            style={{ display: 'block' }}
          ></canvas>
        </motion.div>
      </div>
      
      {/* 内容层 - 确保它在背景之上并且可以正常滚动 */}
      <div className={cn('relative z-10', className)}>
        {children}
      </div>
    </>
  );
};

export default Vortex;