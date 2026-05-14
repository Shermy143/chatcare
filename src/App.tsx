import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardScreen from './components/DashboardScreen';

type Screen = 'login' | 'register' | 'dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [direction, setDirection]         = useState(1);
  const [userId, setUserId]               = useState<string | null>(null);

  // Gestión de sesión con Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setCurrentScreen('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setCurrentScreen('dashboard');
      } else {
        setUserId(null);
        setCurrentScreen('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (screen: Screen, dir: number = 1) => {
    setDirection(dir);
    setCurrentScreen(screen);
  };

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? '50%' : '-50%', opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:   (d: number) => ({ x: d < 0 ? '50%' : '-50%', opacity: 0, scale: 0.98 }),
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-background text-on-background font-sans flex antialiased">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {currentScreen === 'login' && (
          <motion.div key="login" custom={direction} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full flex">
            <LoginScreen onNavigate={navigate} />
          </motion.div>
        )}
        {currentScreen === 'register' && (
          <motion.div key="register" custom={direction} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full flex">
            <RegisterScreen onNavigate={navigate} />
          </motion.div>
        )}
        {currentScreen === 'dashboard' && userId && (
          <motion.div key="dashboard" custom={direction} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full h-full flex">
            <DashboardScreen userId={userId} onNavigate={navigate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
