import { useEffect, useState } from 'react';
<<<<<<< Updated upstream
=======
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
>>>>>>> Stashed changes
import { aiApi } from '../api/dashboard';
import type { AiRiskAssessment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { riskColors } from '../utils/status';

<<<<<<< Updated upstream
export default function AiInsights() {
  const [risks, setRisks] = useState<AiRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
=======
type RiskFilter = 'ALL' | 'HIGH_CRITICAL' | 'MEDIUM' | 'LOW';

export default function AiInsights() {
  const [risks, setRisks] = useState<AiRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
>>>>>>> Stashed changes

  useEffect(() => {
    aiApi.assessAllRisks()
      .then(setRisks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

<<<<<<< Updated upstream
  const highRisk = risks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
  const mediumRisk = risks.filter(r => r.riskLevel === 'MEDIUM');
  const lowRisk = risks.filter(r => r.riskLevel === 'LOW');
=======
  const sufficientRisks = risks.filter(r => !r.insufficientData);
  const insufficientRisks = risks.filter(r => r.insufficientData);
  const highRisk = sufficientRisks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
  const mediumRisk = sufficientRisks.filter(r => r.riskLevel === 'MEDIUM');
  const lowRisk = sufficientRisks.filter(r => r.riskLevel === 'LOW');

  const filteredSufficient = sufficientRisks.filter(r => {
    if (riskFilter === 'ALL') return true;
    if (riskFilter === 'HIGH_CRITICAL') return r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL';
    if (riskFilter === 'MEDIUM') return r.riskLevel === 'MEDIUM';
    if (riskFilter === 'LOW') return r.riskLevel === 'LOW';
    return true;
  });
>>>>>>> Stashed changes

  return (
    <div className="space-y-6">
      {/* Summary */}
<<<<<<< Updated upstream
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
=======
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
>>>>>>> Stashed changes
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Analyzed</p>
          <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
<<<<<<< Updated upstream
          <p className="text-sm text-gray-500">Critical/High Risk</p>
=======
          <p className="text-sm text-gray-500">Critical / High Risk</p>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      {/* Risk Cards */}
=======
      {/* Risk level filter */}
      {risks.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          {(['ALL', 'HIGH_CRITICAL', 'MEDIUM', 'LOW'] as RiskFilter[]).map(opt => (
            <button
              key={opt}
              onClick={() => setRiskFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                riskFilter === opt
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt === 'ALL' ? 'All' : opt === 'HIGH_CRITICAL' ? 'High & Critical' : opt === 'MEDIUM' ? 'Medium' : 'Low'}
            </button>
          ))}
        </div>
      )}

>>>>>>> Stashed changes
      {risks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No assets to analyze. Add assets first.</p>
        </div>
      ) : (
<<<<<<< Updated upstream
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
                    className={`h-2 rounded-full ${
                      risk.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                      risk.riskLevel === 'HIGH' ? 'bg-orange-500' :
                      risk.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${risk.failureProbability * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
=======
        <div className="space-y-6">
          {/* Assets with sufficient data */}
          {filteredSufficient.length === 0 && riskFilter !== 'ALL' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
              No assets match the selected risk level.
            </div>
          ) : filteredSufficient.length > 0 && (
            <div className="space-y-4">
              {filteredSufficient.map((risk) => (
                <div key={risk.assetId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{risk.assetName}</h3>
                      <Link to={`/assets/${risk.assetId}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                        View asset →
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${riskColors[risk.riskLevel] ?? 'bg-gray-100 text-gray-800'}`}>
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
                        className={`h-2 rounded-full ${
                          risk.riskLevel === 'CRITICAL' ? 'bg-red-600' :
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

          {/* Assets missing description + photo */}
          {insufficientRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  {insufficientRisks.length} asset{insufficientRisks.length > 1 ? 's' : ''} need more info for AI analysis
                </h2>
              </div>
              <div className="space-y-2">
                {insufficientRisks.map((risk) => (
                  <div
                    key={risk.assetId}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">{risk.assetName}</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                          {risk.message ?? 'Not enough information to predict risk. Add a description and upload a photo.'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/assets/${risk.assetId}`}
                      className="ml-4 flex-shrink-0 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium rounded-lg transition-colors"
                    >
                      Add info →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
>>>>>>> Stashed changes
        </div>
      )}
    </div>
  );
}
