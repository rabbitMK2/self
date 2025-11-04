import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import LampEffect from './LampEffect';

const Footer = () => {
  const [currentYear] = useState(new Date().getFullYear());

  return (
    <footer className="relative bg-transparent text-white pt-24 pb-8 overflow-hidden">
      {/* 底部栏的LampEffect效果 - 作为底部栏的背景 */}
      <div className="absolute inset-0 z-0">
        <LampEffect 
          delay={0.5}
          duration={0.8}
          className="h-full w-full"
        />
      </div>
      
      {/* 半透明渐变背景层 - 使内容更清晰 */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-gray-900/80 to-gray-900/95 backdrop-blur-sm"></div>
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
           {/* 社团介绍 */}
            <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="space-y-4"
           >
               <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-blue mr-2">
                    <img 
                      src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cybersecurity%20shield%20logo%20tech%20future%20blue%20glow&sign=3833687881cc4234790bc8de64fca621" 
                      alt="社团LOGO" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                   <div className="flex flex-col justify-center">
                     <h3 className="text-xl font-orbitron font-bold">
                       网络安全社团
                     </h3>
                     <span className="text-sm font-medium">内蒙古科技大学网安协会</span>
                   </div>
                </div>
            <p className="text-gray-400">
              内蒙古科技大学网络安全社团致力于培养学生的网络安全意识和技术能力，为网络安全行业输送优秀人才。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-weixin"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-weibo"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-github"></i>
              </a>
            </div>
          </motion.div>

          {/* 快速链接 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-white mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-primary-blue transition-colors">首页</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-primary-blue transition-colors">社团介绍</a></li>
              <li><a href="/news" className="text-gray-400 hover:text-primary-blue transition-colors">新闻动态</a></li>
              <li><a href="/achievements" className="text-gray-400 hover:text-primary-blue transition-colors">赛事荣誉</a></li>
              <li><a href="/mentors" className="text-gray-400 hover:text-primary-blue transition-colors">导师团队</a></li>
              <li><a href="/platforms" className="text-gray-400 hover:text-primary-blue transition-colors">学习平台</a></li>
            </ul>
          </motion.div>

          {/* 联系我们 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-white mb-4">联系我们</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fa-solid fa-map-marker-alt text-primary-blue mt-1 mr-3"></i>
                <span className="text-gray-400">内蒙古科技大学信息楼505室</span>
              </li>
              <li className="flex items-center">
                <i className="fa-solid fa-envelope text-primary-blue mr-3"></i>
                <a href="mailto:security@imust.edu.cn" className="text-gray-400 hover:text-primary-blue transition-colors">security@imust.edu.cn</a>
              </li>
              <li className="flex items-center">
                <i className="fa-solid fa-phone text-primary-blue mr-3"></i>
                <span className="text-gray-400">0472-5951234</span>
              </li>
            </ul>
          </motion.div>

           {/* 社交媒体 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-white mb-4">关注我们</h3>
            <p className="text-gray-400">通过社交媒体获取最新动态</p>
            <div className="flex space-x-4">
              <a href="#" className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-weixin text-xl"></i>
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-weibo text-xl"></i>
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-github text-xl"></i>
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-primary-blue hover:text-white transition-colors">
                <i className="fa-brands fa-qq text-xl"></i>
              </a>
            </div>
          </motion.div>
        </div>

        {/* 版权信息 */}
        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {currentYear} 内蒙古科技大学网络安全社团. 保留所有权利.</p>
          <p className="mt-2">蒙ICP备XXXXXXXX号-1 | 公安备案号：XXXXXXXXXXXXX</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;