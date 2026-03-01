/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FichaObra } from './components/FichaObra';
import { PerfilInstalador } from './components/PerfilInstalador';
import { DashboardJefeInstalaciones } from './components/DashboardJefeInstalaciones';
import { CentroLegalizaciones } from './components/CentroLegalizaciones';
import { LogisticaMateriales } from './components/LogisticaMateriales';
import { ModuloFinanciero } from './components/ModuloFinanciero';
import { Monitor, Smartphone, ShieldCheck, FileSignature, Package, Banknote, LogOut, User as UserIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { LoginPage } from './pages/LoginPage';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { socket } = useSocket();
  const [view, setView] = useState<'backoffice' | 'instalador' | 'jefe' | 'legalizaciones' | 'logistica' | 'financiero'>('jefe');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (socket) {
      const handleTransition = (data: any) => {
        addNotification({
          id: Date.now(),
          title: 'Cambio de Estado',
          message: `${data.user} cambió ${data.domain} a ${data.to.replace(/_/g, ' ')} en obra ${data.obraId}`,
          type: 'info'
        });
      };

      const handleDocAdded = (data: any) => {
        addNotification({
          id: Date.now(),
          title: 'Nuevo Documento',
          message: `${data.user} subió ${data.document.nombre} a la obra ${data.obraId}`,
          type: 'success'
        });
      };

      socket.on('obra:transition', handleTransition);
      socket.on('obra:document:added', handleDocAdded);

      return () => {
        socket.off('obra:transition', handleTransition);
        socket.off('obra:document:added', handleDocAdded);
      };
    }
  }, [socket]);

  const addNotification = (notif: any) => {
    setNotifications(prev => [notif, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header / User Info */}
      <div className="bg-slate-950 px-6 py-3 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-white font-bold tracking-tight">InstalaPRO</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-white font-medium">{user?.name}</span>
              <span className="text-slate-500 text-xs font-mono">{user?.role}</span>
            </div>
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-white/5">
              <UserIcon className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dev Tools / View Switcher (Solo para desarrollo/demo) */}
      <div className="bg-slate-950 text-slate-400 p-3 flex justify-center gap-4 text-sm border-b border-slate-800 flex-wrap">
        <button 
          onClick={() => setView('jefe')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'jefe' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
        >
          <ShieldCheck className="w-4 h-4" /> Jefe Instalaciones
        </button>
        <button 
          onClick={() => setView('legalizaciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'legalizaciones' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
        >
          <FileSignature className="w-4 h-4" /> Legalizaciones
        </button>
        <button 
          onClick={() => setView('logistica')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'logistica' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
        >
          <Package className="w-4 h-4" /> Logística
        </button>
        <button 
          onClick={() => setView('financiero')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'financiero' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
        >
          <Banknote className="w-4 h-4" /> Financiero
        </button>
        <button 
          onClick={() => setView('backoffice')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'backoffice' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
        >
          <Monitor className="w-4 h-4" /> Backoffice (Ficha Obra)
        </button>
        <button 
          onClick={() => setView('instalador')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'instalador' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
        >
          <Smartphone className="w-4 h-4" /> App Instalador
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {view === 'jefe' ? <DashboardJefeInstalaciones /> : 
         view === 'legalizaciones' ? <CentroLegalizaciones /> :
         view === 'logistica' ? <LogisticaMateriales /> :
         view === 'financiero' ? <ModuloFinanciero /> :
         view === 'backoffice' ? <FichaObra /> : 
         <PerfilInstalador />}

        {/* Notifications Overlay */}
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className={`p-4 rounded-xl shadow-2xl border w-80 pointer-events-auto ${
                  n.type === 'success' ? 'bg-emerald-900 border-emerald-500 text-emerald-50' :
                  n.type === 'error' ? 'bg-rose-900 border-rose-500 text-rose-50' :
                  'bg-slate-800 border-slate-600 text-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider opacity-70">{n.title}</h4>
                  <button onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}>
                    <LogOut className="w-3 h-3 rotate-90" />
                  </button>
                </div>
                <p className="text-sm">{n.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
