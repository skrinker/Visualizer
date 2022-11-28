import React, { useEffect, useState } from 'react';
import { visualizerModule } from '../Visualizer/VisualizerModule';
import './PlaybackProgress.scss';
import { Button } from 'antd';
import useInterval from '../shared/useInterval';

export const PlaybackProgress = () => {
    const [currentTime, setCurrentTime] = useState(0);

    useInterval(() => {
        if (currentTime !== visualizerModule.audioContext?.currentTime) {
            setCurrentTime(visualizerModule.audioContext?.currentTime || 0);
        }
    }, 1000);

    const getPlaybackProgressValues = (currentTime: number, duration: number) =>
        `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60)} / ${Math.floor(duration / 60)}:${Math.floor(
            duration % 60
        )}`;

    const handlePauseClick = () => {
        visualizerModule.audioContext?.suspend();
    };

    const handleResumeClick = () => {
        visualizerModule.audioContext?.resume();
    };

    return (
        <>
            <div className="player">
                <div
                    className="playback-progress-bar"
                    style={{
                        width: `${(currentTime * 100) / visualizerModule.duration}%`,
                        backgroundColor: currentTime !== 0 ? '#ffde5d' : '#ffffff'
                    }}
                ></div>
                <div className="player-control">
                    {getPlaybackProgressValues(currentTime, visualizerModule.duration)}
                    <div className="player-control-buttons">
                        <Button onClick={handlePauseClick}>Pause</Button>
                        <Button onClick={handleResumeClick}>Play</Button>
                    </div>
                </div>
            </div>
        </>
    );
};
