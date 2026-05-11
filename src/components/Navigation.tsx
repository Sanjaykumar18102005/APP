import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Camera, MessageSquare, User, Mic } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Sparkles, label: 'Glow', path: '/builder' },
  { icon: Camera, label: 'Vision', path: '/vision' },
  { icon: Mic, label: 'Voice', path: '/voice' },
  { icon: User, label: 'Profile', path: '/profile' }
];

export function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:hidden pointer-events-none">
      <nav className="glass-panel mx-auto flex items-center justify-between px-2 pt-2 pb-2 max-w-md pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative overflow-hidden group",
                  isActive ? "text-primary-accent" : "text-text-soft hover:text-[var(--text-main)]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-primary-accent/10 rounded-xl" />
                  )}
                  <Icon className={cn("w-6 h-6 z-10 transition-transform duration-300", isActive && "scale-110")} />
                  <span className={cn("text-[10px] mt-1 z-10 font-medium transition-opacity duration-300", isActive ? "opacity-100" : "opacity-0 h-0 mt-0")}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  // A simple sidebar for md+ screens
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-glass-border bg-bg-surface/50 backdrop-blur-2xl px-4 py-8 z-50">
      <div className="flex items-center gap-2 px-2 mb-12">
        <Sparkles className="w-8 h-8 text-primary-accent" />
        <h1 className="text-xl font-display font-bold neon-text">PromptGlow</h1>
      </div>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                  isActive ? "text-[var(--text-main)] bg-primary-accent/10 border border-primary-accent/20" : "text-text-soft hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] border border-transparent"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5", isActive && "text-primary-accent")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
