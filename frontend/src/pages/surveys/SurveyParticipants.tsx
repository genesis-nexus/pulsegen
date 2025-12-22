import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ParticipantList } from '../../components/survey/participants/ParticipantList';
import { ParticipantStats } from '../../components/survey/participants/ParticipantStats';
import { ParticipantImporter } from '../../components/survey/participants/ParticipantImporter';
import { InviteComposer } from '../../components/survey/participants/InviteComposer';
import { AddParticipantForm } from '../../components/survey/participants/AddParticipantForm';
import toast from 'react-hot-toast';

export default function SurveyParticipants() {
    const { id } = useParams<{ id: string }>();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showImporter, setShowImporter] = useState(false);
    const [showInviteComposer, setShowInviteComposer] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedForInvite, setSelectedForInvite] = useState<string[]>([]);

    // Function to refresh stats and list
    const refreshData = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleImportSuccess = () => {
        toast.success('Participants imported successfully');
        setShowImporter(false);
        refreshData();
    };

    const handleInviteClick = (ids: string[]) => {
        setSelectedForInvite(ids);
        setShowInviteComposer(true);
    };

    // We need to pass the "import" button click handler down to ParticipantList
    // Or lift the "import" button up to here. 
    // Let's modify ParticipantList to accept onImportClick prop.
    // Actually, for cleaner composition, let's keep the Import button inside ParticipantList
    // but we need to intercept it.
    //
    // Alternatively, we can render the buttons here in the page 
    // and pass them as children or simply render them above the list component.
    //
    // However, I already put the header inside ParticipantList.tsx.
    // Let's check ParticipantList.tsx content again.
    // ... It has its own header. I should probably modify ParticipantList to accept action handlers.

    // Re-reading ParticipantList.tsx:
    // It has "Import CSV", "Add Participant" buttons.
    // I should update ParticipantList.tsx to accept props for these actions.

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    to={`/surveys/${id}/dashboard`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Participant Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage invites, track responses, and view participant analytics.
                </p>
            </div>

            <ParticipantStats refreshTrigger={refreshTrigger} />

            <ParticipantList
                onRefreshStats={refreshData}
                onImport={() => setShowImporter(true)}
                onInvite={handleInviteClick}
                onAdd={() => setShowAddForm(true)}
            />

            {/* Modals */}
            {showImporter && (
                <ParticipantImporter
                    onImportSuccess={handleImportSuccess}
                    onClose={() => setShowImporter(false)}
                />
            )}

            {showAddForm && (
                <AddParticipantForm
                    onSuccess={refreshData}
                    onClose={() => setShowAddForm(false)}
                />
            )}

            {showInviteComposer && (
                <InviteComposer
                    participantIds={selectedForInvite}
                    onClose={() => setShowInviteComposer(false)}
                    onSuccess={refreshData}
                />
            )}
        </div>
    );
}
