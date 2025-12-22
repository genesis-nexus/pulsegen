import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { participantApi } from '../../../lib/api';
import { ParticipantStats as StatsType, ParticipantStatus } from '../../../types';
import { Users, Mail, CheckCircle, Clock } from 'lucide-react';

interface ParticipantStatsProps {
    refreshTrigger: number;
}

export const ParticipantStats: React.FC<ParticipantStatsProps> = ({ refreshTrigger }) => {
    const { id: surveyId } = useParams<{ id: string }>();
    const [stats, setStats] = useState<StatsType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!surveyId) return;
            try {
                const data = await participantApi.getStats(surveyId);
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [surveyId, refreshTrigger]);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
        </div>;
    }

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Participants</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <Users className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Invited</p>
                    <div className="flex items-baseline">
                        <p className="text-2xl font-bold text-gray-900">
                            {(stats.byStatus[ParticipantStatus.INVITED] || 0) + (stats.byStatus[ParticipantStatus.STARTED] || 0) + (stats.byStatus[ParticipantStatus.COMPLETED] || 0)}
                        </p>
                        <p className="ml-2 text-xs text-gray-400">
                            {Math.round(((stats.byStatus[ParticipantStatus.INVITED] || 0) + (stats.byStatus[ParticipantStatus.STARTED] || 0) + (stats.byStatus[ParticipantStatus.COMPLETED] || 0)) / (stats.total || 1) * 100)}%
                        </p>
                    </div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                    <Mail className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {stats.responseRate ? stats.responseRate.toFixed(1) : 0}%
                    </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <Clock className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus[ParticipantStatus.COMPLETED] || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};
