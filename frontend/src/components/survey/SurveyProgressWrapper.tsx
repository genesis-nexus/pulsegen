import React from 'react';
import { ProgressBar } from './ProgressBar';
import { Survey } from '../../types';

interface SurveyProgressWrapperProps {
    survey: Survey;
    currentPage: number;
    totalPages: number;
    currentQuestion: number;
    totalQuestions: number;
    children: React.ReactNode;
}

export function SurveyProgressWrapper({
    survey,
    currentPage,
    totalPages,
    currentQuestion,
    totalQuestions,
    children,
}: SurveyProgressWrapperProps) {
    if (!survey.showProgressBar) {
        return <>{children}</>;
    }

    const progressProps = {
        currentPage,
        totalPages,
        currentQuestion,
        totalQuestions,
        style: survey.progressBarStyle || 'bar',
        format: survey.progressBarFormat || 'percentage',
    };

    return (
        <div className="flex flex-col min-h-screen">
            {(survey.progressBarPosition === 'top' || survey.progressBarPosition === 'both' || !survey.progressBarPosition) && (
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4">
                    <ProgressBar {...progressProps} position="top" />
                </div>
            )}

            <div className="flex-1">
                {children}
            </div>

            {(survey.progressBarPosition === 'bottom' || survey.progressBarPosition === 'both') && (
                <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t dark:border-gray-800 px-4">
                    <ProgressBar {...progressProps} position="bottom" />
                </div>
            )}
        </div>
    );
}
