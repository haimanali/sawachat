import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./features/auth/signup/signup"
import Login from "./features/auth/login/login"
import Index from "./features/index/index"
import Error from "./features/error/error"
import Home from "./features/home/home"
import "./assets/style.css"
import { AppProvider } from './hooks/useApp';
import { ProtectedProvider } from './hooks/useProtected';
import Ban from './features/auth/ban/ban';
import NotFound from './features/notFound/notFound';
import Help from './features/help/help';
import Policies from './features/policies/policies';


function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route path="/u/:username">
            <Route index element={
              <ProtectedProvider>
                <Home />
              </ProtectedProvider>
            } />

            <Route path="ban" element={<Ban />} />
          </Route>

          <Route path="/error" element={<Error />} />
          
          <Route path="/help" element={<Help />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)