// frontend/src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ↓↓↓ ¡ESTAS SON LAS LÍNEAS MÁGICAS QUE ARREGLAN EL DISEÑO! ↓↓↓
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';
// ↑↑↑ ¡ASEGÚRATE DE QUE ESTÉN AQUÍ! ↑↑↑

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)