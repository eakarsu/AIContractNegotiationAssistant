import ClauseDiffViewer from '../components/ClauseDiffViewer';
import NegotiationTimeline from '../components/NegotiationTimeline';
import RedlinePDF from '../components/RedlinePDF';
import ClauseLibrary from '../components/ClauseLibrary';

export default function CustomViewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contract Views</h1>
        <p className="text-sm text-gray-500">
          Specialized clause and negotiation tools: diff viewer, revision timeline,
          redline PDF export, and standard clause library editor.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ClauseDiffViewer />
        <NegotiationTimeline />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RedlinePDF />
        <ClauseLibrary />
      </div>
    </div>
  );
}
