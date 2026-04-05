import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./signup"
import Login from "./login";
import Index from "./index"
import Error from "./error"
import Home from "./home"
import "./assets/style.css"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/u/:username" element={ <Home />}/>
        <Route path="/error" element={<Error  />} />


        <Route path="*" element={<Error />} /> 
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)