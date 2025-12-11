
import { cn } from '../../lib/utils'; // Corrected import path
import { useTranslation } from 'react-i18next';

interface ProgressBarProps {
    currentPage: number;
    totalPages: number;
    currentQuestion: number;
    totalQuestions: number;
    style: 'bar' | 'steps' | 'minimal' | 'combined';
    format: 'percentage' | 'count' | 'both';
    position: 'top' | 'bottom';
    className?: string;
}

export function ProgressBar({
    currentPage,
    totalPages,
    currentQuestion,
    totalQuestions,
    style,
    format,
    className,
}: ProgressBarProps) {
    const { t } = useTranslation('survey');
    const percentage = Math.round((currentQuestion / totalQuestions) * 100) || 0;

    const renderBar = () => (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
                className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );

    const renderSteps = () => (
        <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
                <div
                    key={i}
                    className={cn(
                        'w-3 h-3 rounded-full transition-colors duration-300',
                        i < currentPage ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                />
            ))}
        </div>
    );

    const renderLabel = () => {
        if (format === 'percentage') {
            return <span>{percentage}% {t('respondent.complete', 'complete')}</span>;
        }
        if (format === 'count') {
            return <span>{t('respondent.questionProgress', { current: currentQuestion, total: totalQuestions })}</span>;
        }
        return (
            <span>
                {t('respondent.pageProgress', { current: currentPage, total: totalPages })} • {t('respondent.questionProgress', { current: currentQuestion, total: totalQuestions })} • {percentage}%
            </span>
        );
    };

    if (style === 'minimal') {
        return (
            <div className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>
                {renderLabel()}
            </div>
        );
    }

    if (style === 'steps') {
        return (
            <div className={cn('flex items-center justify-between gap-4 py-2', className)}>
                {renderSteps()}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('respondent.pageProgress', { current: currentPage, total: totalPages })}
                </span>
            </div>
        );
    }

    if (style === 'combined') {
        return (
            <div className={cn('space-y-2 py-2', className)}>
                {renderBar()}
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {renderLabel()}
                </div>
            </div>
        );
    }

    // Default: bar style
    return (
        <div className={cn('flex items-center gap-4 py-2', className)}>
            <div className="flex-1">{renderBar()}</div>
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {format === 'percentage' ? `${percentage}%` : `${currentQuestion}/${totalQuestions}`}
            </span>
        </div>
    );
}
