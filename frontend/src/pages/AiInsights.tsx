import { useEffect, useState } from 'react';
import { aiApi } from '../api/dashboard';
import type { AiRiskAssessment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { riskColors } from '../utils/status';

export default function AiInsights() {
  const [risks, setRisks] = useState<AiRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiApi.assessAllRisks()
      .then(setRisks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const highRisk = risks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
  const mediumRisk = risks.filter(r => r.riskLevel === 'MEDIUM');
  const lowRisk = risks.filter(r => r.riskLevel === 'LOW');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Analyzed</p>
          <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
          <p className="text-sm text-gray-500">Critical/High Risk</p>
          <p className="text-2xl font-bold text-red-600">{highRisk.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-4">
          <p className="text-sm text-gray-500">Medium Risk</p>
          <p className="text-2xl font-bold text-yellow-600">{mediumRisk.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
          <p className="text-sm text-gray-500">Low Risk</p>
          <p className="text-2xl font-bold text-green-600">{lowRisk.length}</p>
        </div>
      </div>

      {/* Risk Cards */}
      {risks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No assets to analyze. Add assets first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {risks.map((risk) => (
            <div key={risk.assetId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{risk.assetName}</h3>
                  <p className="text-sm text-gray-500">Asset ID: {risk.assetId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${riskColors[risk.riskLevel]}`}>
                    {risk.riskLevel}
                  </span>
                  <span className="text-sm text-gray-500">
                    {(risk.failureProbability * 100).toFixed(0)}% failure probability
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Factors</h4>
                  <ul className="space-y-1">
                    {risk.riskFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-500 mt-0.5">&#x2022;</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {risk.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">&#x2022;</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Risk bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${risk.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                        risk.riskLevel === 'HIGH' ? 'bg-orange-500' :
                          risk.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${risk.failureProbability * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
