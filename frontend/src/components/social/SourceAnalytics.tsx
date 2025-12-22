import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Mail,
  Globe,
  QrCode,
  Smartphone,
  Monitor,
  Share2,
  Search,
  Link2,
} from 'lucide-react';

interface SourceData {
  source: string;
  channel?: string;
  count: number;
  completionRate: number;
  avgDuration: number;
}

interface SourceAnalyticsProps {
  data: SourceData[];
  totalResponses: number;
}

const SOURCE_COLORS: Record<string, string> = {
  social: '#3B82F6',
  email: '#10B981',
  direct: '#8B5CF6',
  qr: '#F59E0B',
  embed: '#EC4899',
  search: '#14B8A6',
  referral: '#6366F1',
  api: '#84CC16',
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  email: Mail,
  direct: Globe,
  qr: QrCode,
  embed: Monitor,
  search: Search,
  referral: Link2,
};

export default function SourceAnalytics({ data, totalResponses }: SourceAnalyticsProps) {
  const [viewMode, setViewMode] = useState<'source' | 'channel'>('source');

  // Aggregate data by source
  const sourceData = data.reduce((acc, item) => {
    const existing = acc.find((d) => d.source === item.source);
    if (existing) {
      existing.count += item.count;
      existing.completionRate = (existing.completionRate + item.completionRate) / 2;
      existing.avgDuration = (existing.avgDuration + item.avgDuration) / 2;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as SourceData[]);

  // Aggregate data by channel
  const channelData = data.filter((d) => d.channel).sort((a, b) => b.count - a.count);

  const displayData = viewMode === 'source' ? sourceData : channelData;
  const chartData = displayData.map((item) => ({
    name: viewMode === 'source' ? item.source : item.channel || 'unknown',
    value: item.count,
    percentage: ((item.count / totalResponses) * 100).toFixed(1),
    completionRate: item.completionRate.toFixed(1),
    avgDuration: Math.round(item.avgDuration / 60),
  }));

  const getIcon = (name: string) => {
    const IconComponent = CHANNEL_ICONS[name.toLowerCase()] || Share2;
    return IconComponent;
  };

  return (
    <div className="card bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-primary-600" />
            Traffic Sources
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Where your survey responses are coming from
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('source')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'source'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Source
          </button>
          <button
            onClick={() => setViewMode('channel')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'channel'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Channel
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No source data available yet</p>
          <p className="text-sm mt-2">
            Share your survey using tracked links to see traffic sources here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Response Volume</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                  }}
                  formatter={(value: number) => [
                    `${value} responses (${((value / totalResponses) * 100).toFixed(1)}%)`,
                    'Responses',
                  ]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SOURCE_COLORS[entry.name.toLowerCase()] || '#6B7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={(entry) => `${entry.percentage}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SOURCE_COLORS[entry.name.toLowerCase()] || '#6B7280'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-gray-700 capitalize">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Stats Table */}
      {chartData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Detailed Metrics</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Responses</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Share</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Completion Rate
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Avg. Duration</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item) => {
                  const Icon = getIcon(item.name);
                  return (
                    <tr key={item.name} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="p-1.5 rounded"
                            style={{
                              backgroundColor:
                                SOURCE_COLORS[item.name.toLowerCase()] || '#6B7280',
                            }}
                          >
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-medium text-gray-900 capitalize">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {item.value}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.percentage}%</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            parseFloat(item.completionRate) >= 80
                              ? 'bg-green-100 text-green-700'
                              : parseFloat(item.completionRate) >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.completionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.avgDuration}m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile vs Desktop */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Device Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Mobile</p>
                <p className="text-2xl font-bold text-blue-900">--</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Desktop</p>
                <p className="text-2xl font-bold text-purple-900">--</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Device breakdown data will appear as responses come in
        </p>
      </div>
    </div>
  );
}

// Mini version for dashboard widgets
export function SourceAnalyticsMini({ data }: { data: SourceData[] }) {
  const topSources = data.slice(0, 3);

  if (topSources.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No source data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topSources.map((source) => {
        const Icon = CHANNEL_ICONS[source.channel?.toLowerCase() || source.source] || Share2;
        return (
          <div key={source.channel || source.source} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 capitalize">
                {source.channel || source.source}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">{source.count}</span>
          </div>
        );
      })}
    </div>
  );
}
