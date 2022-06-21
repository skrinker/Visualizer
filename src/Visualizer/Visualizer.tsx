import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload } from 'antd';
import React, { createRef, LegacyRef, ReactElement, useEffect, useRef, useState } from 'react';

import { VisualizerModule } from './VisualizerModule';

export const Visualizer = (): ReactElement => {
    const [arrayBuffer, setArrayBuffer] = useState<undefined | VisualizerModule>(undefined);
    const canvasRef: LegacyRef<HTMLCanvasElement> = createRef();
    arrayBuffer?.draw();

    return (
        <>
            <Upload
                beforeUpload={(file) => {
                    file.arrayBuffer().then((data) => {
                        setArrayBuffer(new VisualizerModule(data, canvasRef.current!));
                    });
                    return false;
                }}
            >
                <Button icon={<UploadOutlined />} onClick={() => arrayBuffer?.draw()}>
                    Select File
                </Button>
            </Upload>
            <canvas ref={canvasRef} height="700px" width="1000px"></canvas>
        </>
    );
};
