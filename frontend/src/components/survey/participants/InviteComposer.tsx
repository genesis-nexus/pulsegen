import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { participantApi } from '../../../lib/api';
import { Send, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteComposerProps {
    participantIds: string[];
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteComposer: React.FC<InviteComposerProps> = ({ participantIds, onClose, onSuccess }) => {
    const { id: surveyId } = useParams<{ id: string }>();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    // Could load default template here if we had an endpoint for it

    const handleSend = async () => {
        if (!surveyId) return;

        setLoading(true);
        try {
            await participantApi.sendInvitations(surveyId, {
                participantIds,
                customSubject: subject,
                customBody: body
            });

            toast.success(`Invitations sent to ${participantIds.length} participants`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invitations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Send className="w-5 h-5 mr-2 text-blue-600" />
                        Compose Invitation
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                        <p className="text-sm text-blue-800">
                            Sending to <strong>{participantIds.length}</strong> participants.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                        <input
                            type="text"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="You are invited to take a survey..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Message</label>
                        <div className="text-xs text-gray-500 mb-2">
                            Supported merge tags: <code className="bg-gray-100 px-1 rounded">{`{{firstName}}`}</code>, <code className="bg-gray-100 px-1 rounded">{`{{lastName}}`}</code>, <code className="bg-gray-100 px-1 rounded">{`{{surveyTitle}}`}</code>, <code className="bg-gray-100 px-1 rounded text-red-500">{`{{surveyUrl}}`}</code> (Required)
                        </div>
                        <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border h-48 font-mono text-sm"
                            placeholder="<p>Dear {{firstName}},</p><p>...</p>"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        ></textarea>
                    </div>

                    {!body.includes('{{surveyUrl}}') && body.length > 0 && (
                        <div className="flex items-start text-amber-600 text-sm bg-amber-50 p-2 rounded">
                            <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                            Warning: Your message does not contain the {'{{surveyUrl}}'} merge tag. The system will append a default link button.
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                        Send Invitations
                    </button>
                </div>
            </div>
        </div>
    );
};
