import { Button, Upload } from 'antd';
import React, { createRef, LegacyRef, ReactElement, useState, useEffect, useRef } from 'react';
import { visualizerModule,  } from './VisualizerModule';
import { RcFile } from 'antd/lib/upload';
import './Visualizer.scss';
import { PlaybackProgress } from '../PlaybackProgress/PlaybackProgress';

export const Visualizer = (): ReactElement => {
    const canvasRef: LegacyRef<HTMLCanvasElement> = createRef();
    const [file, setFile] = useState<RcFile | null>(null);

    const uploadButton = (
        <Button className="upload-button" type="primary">
            Upload
        </Button>
    );

    useEffect(() => {
        if (file && canvasRef.current) {
            file.arrayBuffer().then((data) => {
                visualizerModule.setup(data, canvasRef.current!);
                visualizerModule.draw();
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
                onRemove={() => {
                    setFile(null);
                    visualizerModule.clear();
                }}
            >
                <div className="upload">{file ? 'loaded' : uploadButton}</div>
            </Upload>
            <div className="canvas">
                <canvas
                    style={{ display: file ? 'inherit' : 'none' }}
                    ref={canvasRef}
                    height="700px"
                    width="700px"
                ></canvas>
            </div>
            <PlaybackProgress />
        </div>
    );
};
