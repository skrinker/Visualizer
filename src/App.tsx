import React from 'react';
import { Visualizer } from './Visualizer/Visualizer';
import './App.scss';
import { ConfigProvider } from 'antd';
function App() {
    return (
        <div className="App">
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#fcdc5c',
                        colorPrimaryBgHover: '#fffef0'
                    }
                }}
            >
                <Visualizer />
            </ConfigProvider>
        </div>
    );
}

export default App;
