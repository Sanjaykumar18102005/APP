import { ReactNode } from 'react';
import { BottomNav, Sidebar } from './Navigation';
import { motion } from 'motion/react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-nebula overflow-x-hidden">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-accent/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary-accent/20 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <Sidebar />
      <main className="md:ml-64 relative min-h-screen pb-24 md:pb-0">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
           className="w-full h-full"
        >
          {children}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
