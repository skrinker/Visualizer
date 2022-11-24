import { Upload } from 'antd';
import React, { createRef, LegacyRef, ReactElement, useState, useEffect } from 'react';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { VisualizerModule } from './VisualizerModule';
import { RcFile } from 'antd/lib/upload';
import './Visualizer.scss';

export const Visualizer = (): ReactElement => {
    const canvasRef: LegacyRef<HTMLCanvasElement> = createRef();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<RcFile | null>(null);

    const uploadButton = (
        <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ margin: 8 }}>Upload</div>
        </div>
    );

    useEffect(() => {
        if (file && canvasRef.current) {
            file.arrayBuffer().then((data) => {
                const buffer = new VisualizerModule(data, canvasRef.current!);
                buffer.draw();
                return buffer;
            });
        }
    }, [file, canvasRef]);

    return (
        <div className="visualizer">
            <Upload
                // onDrop={(e) => {
                //     console.log('Dropped files', e.dataTransfer.files[0]);
                // }}
                beforeUpload={(file) => {
                    setFile(file);
                    return false;
                }}
            >
                {file ? 'loaded' : uploadButton}
            </Upload>
            <div className="canvas">
                <canvas ref={canvasRef} height="700px" width="700px"></canvas>
            </div>
        </div>
    );
};
