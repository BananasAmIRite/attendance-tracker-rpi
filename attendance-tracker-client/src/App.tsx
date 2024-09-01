import React from 'react';
import logo from './logo.svg';
import './App.css';
import UserScanScreen from './screens/UserScanScreen';
import axios from 'axios';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import CacheScreen from './screens/CacheScreen';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

function App() {
    return (
        <div className='App'>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<UserScanScreen />} />
                    <Route path='/supersecretscreen' element={<CacheScreen />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
