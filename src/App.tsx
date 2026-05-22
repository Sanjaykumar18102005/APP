/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { PromptBuilder } from './pages/PromptBuilder';
import { Vision } from './pages/Vision';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Voice } from './pages/Voice';
import { AuthProvider } from './lib/auth-context';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<PromptBuilder />} />
            <Route path="/vision" element={<Vision />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/voice" element={<Voice />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
