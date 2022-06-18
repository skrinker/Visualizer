import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload } from 'antd';
import React, { ReactElement, useState } from 'react';

import { VisualizerModule } from './VisualizerModule';

export const Visualizer = (): ReactElement => {
    const [arrayBuffer, setArrayBuffer] = useState<undefined | VisualizerModule>(undefined);

    arrayBuffer?.draw();

    return (
        <>
            <Upload
                beforeUpload={(file) => {
                    file.arrayBuffer().then((data) => {
                        setArrayBuffer(new VisualizerModule(data));
                    });
                    return false;
                }}
            >
                <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
        </>
    );
};
