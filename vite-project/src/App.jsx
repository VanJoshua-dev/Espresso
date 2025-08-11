import { useState } from 'react'
import './App.css'

import { Routes, Route } from 'react-router-dom'
import DinoGame from './Espresso'
function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<DinoGame />} />
      </Routes>
    </>
  )
}

export default App
