import React, { Dispatch, SetStateAction, createContext, useEffect, useState } from 'react';
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
import MessageSnackbar from './components/ErrorSnackbar';

axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

export const GlobalMessageContext = createContext<{
    message: string;
    setMessage: (msg: string) => void;
}>({ message: '', setMessage: () => {} });

function App() {
    const [message, setMessage] = useState({ msg: '' });

    useEffect(() => {
        axios.interceptors.response.use(
            (res) => res,
            (err) => {
                if (err.response) {
                    if (!err.response.data.error) return;
                    setMessage({ msg: err.response.data.error });
                } else {
                    setMessage({ msg: err.message });
                }

                return Promise.reject(err);
            }
        );
    }, [setMessage]);

    return (
        <div className='App' style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <GlobalMessageContext.Provider
                value={{
                    message: message.msg,
                    setMessage: (msg) => {
                        setMessage({ msg });
                    },
                }}
            >
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<UserScanScreen />} />
                        <Route path='/supersecretscreen' element={<CacheScreen />} />
                    </Routes>
                </BrowserRouter>
            </GlobalMessageContext.Provider>

            <MessageSnackbar message={message} />
        </div>
    );
}

export default App;
