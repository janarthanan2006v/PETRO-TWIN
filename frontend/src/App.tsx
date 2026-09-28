import React, { useEffect, useState, useRef } from 'react';
import { api } from './services/api';
import { Well, CoupledState, HistoricalRecord, RecommendationItem, RiskAlertItem } from './types';
import { Navbar } from './components/common/Navbar';
import { Sidebar, PageId } from './components/common/Sidebar';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { DigitalTwinView } from './pages/DigitalTwinView';
import { CSSAnalysisView } from './pages/CSSAnalysisView';
import { SRPMonitoringView } from './pages/SRPMonitoringView';
import { DynamometerView } from './pages/DynamometerView';
import { AIPredictionsView } from './pages/AIPredictionsView';
import { OptimizationView } from './pages/OptimizationView';
import { WhatIfSimulatorView } from './pages/WhatIfSimulatorView';
import { RecommendationsView } from './pages/RecommendationsView';
import { ModelValidationView } from './pages/ModelValidationView';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [wells, setWells] = useState<Well[]>([]);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [coupledState, setCoupledState] = useState<CoupledState | null>(null);
  const [history, setHistory] = useState<HistoricalRecord[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlertItem[]>([]);
  const [simulatorParams, setSimulatorParams] = useState<any>(null);

  const [isLive, setIsLive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initial Load of Wells
  useEffect(() => {
    async function initWells() {
      try {
        const wellsData = await api.getWells();
        setWells(wellsData);
        if (wellsData.length > 0) {
          setSelectedWell(wellsData[0]);
        }
      } catch (err) {
        console.error('Failed to load wells', err);
      }
    }
    initWells();
  }, []);

  // 2. Fetch Data whenever selectedWell changes
  async function fetchWellData(wellId: string) {
    try {
      setLoading(true);
      const [cState, histData, recs, alerts] = await Promise.all([
        api.getCoupledState(wellId),
        api.getHistoricalTelemetry(wellId, 60),
        api.getRecommendations(wellId),
        api.getRiskAlerts(wellId),
      ]);
      setCoupledState(cState);
      setHistory(histData.data);
      setRecommendations(recs);
      setRiskAlerts(alerts);
    } catch (err) {
      console.error('Failed to load well telemetry', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedWell) return;
    fetchWellData(selectedWell.id);

    // Setup Live WebSocket Telemetry Stream
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/digital-twin/${selectedWell.id}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsLive(true);
      };

      ws.onmessage = (event) => {
        try {
          const telemetryTick = JSON.parse(event.data);
          // Gently update live coupled telemetry state
          setCoupledState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              reservoir_tier: {
                ...prev.reservoir_tier,
                reservoir_temperature_c: telemetryTick.reservoir.temperature_c,
                oil_viscosity_cp: telemetryTick.reservoir.viscosity_cp,
              },
              srp_tier: {
                ...prev.srp_tier,
                pprl_lbs: telemetryTick.srp.pprl_lbs,
                mprl_lbs: telemetryTick.srp.mprl_lbs,
                pump_fillage_pct: telemetryTick.srp.pump_fillage_pct,
                is_rod_floating: telemetryTick.srp.is_rod_floating,
              },
              surface_tier: {
                ...prev.surface_tier,
                oil_rate_bpd: telemetryTick.surface.oil_rate_bpd,
              },
            };
          });
        } catch (e) {
          // ignore parsing error
        }
      };

      ws.onerror = () => {
        setIsLive(false);
      };

      ws.onclose = () => {
        setIsLive(false);
      };

      return () => {
        ws.close();
      };
    } catch (e) {
      setIsLive(false);
    }
  }, [selectedWell?.id]);

  function handleApplyToSimulator(params: any) {
    setSimulatorParams(params);
    setCurrentPage('what-if');
  }

  const pendingRecsCount = recommendations.filter((r) => r.approval_status === 'PENDING_REVIEW').length;
  const activeRiskCount = riskAlerts.filter((a) => !a.is_resolved).length;

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        wells={wells}
        selectedWell={selectedWell}
        onSelectWell={(w) => setSelectedWell(w)}
        isLive={isLive}
        onRefresh={() => selectedWell && fetchWellData(selectedWell.id)}
        loading={loading}
      />

      {/* Main Layout with Sidebar and Content Container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          riskCount={activeRiskCount}
          pendingRecsCount={pendingRecsCount}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {currentPage === 'overview' && (
            <OverviewDashboard
              coupledState={coupledState}
              history={history}
              recommendations={recommendations}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'digital-twin' && <DigitalTwinView coupledState={coupledState} />}

          {currentPage === 'css-analysis' && selectedWell && (
            <CSSAnalysisView wellId={selectedWell.id} />
          )}

          {currentPage === 'srp-monitoring' && selectedWell && (
            <SRPMonitoringView wellId={selectedWell.id} />
          )}

          {currentPage === 'dynamometer' && selectedWell && (
            <DynamometerView wellId={selectedWell.id} />
          )}

          {currentPage === 'ai-predictions' && <AIPredictionsView />}

          {currentPage === 'optimization' && (
            <OptimizationView onApplyToSimulator={handleApplyToSimulator} />
          )}

          {currentPage === 'what-if' && (
            <WhatIfSimulatorView initialParams={simulatorParams} />
          )}

          {currentPage === 'recommendations' && selectedWell && (
            <RecommendationsView
              wellId={selectedWell.id}
              onRefreshData={() => selectedWell && fetchWellData(selectedWell.id)}
            />
          )}

          {currentPage === 'model-validation' && selectedWell && (
            <ModelValidationView wellId={selectedWell.id} />
          )}
        </main>
      </div>
    </div>
  );
};
export default App;
