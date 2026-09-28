# PETRO-TWIN: AI-Enabled Well-to-Surface Digital Twin
### Coupled CSS Thermal Recovery and Sucker Rod Pump (SRP) Artificial Lift Optimization in Heavy-Oil Wells

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![NSGA-II](https://img.shields.io/badge/Optimizer-NSGA--II-orange.svg)](https://pymoo.org/)

---

## 1. Executive Summary & Problem Context

In heavy-oil reservoirs (such as the **Oil India Limited Baghewala Field / Rajasthan context** with crude gravity $12^\circ - 18^\circ$ API and in-situ viscosities exceeding $1,000 - 10,000\text{ cP}$), **Cyclic Steam Stimulation (CSS)** is widely utilized to inject high-enthalpy thermal steam to heat the near-wellbore matrix and drastically lower oil viscosity.

However, during each subsequent production cycle:
1. **Thermal Decay**: Reservoir temperature steadily declines ($T_{res}(t) \searrow$), causing crude viscosity to rise exponentially ($\mu_{oil}(T) \nearrow$), decreasing inflow potential.
2. **Artificial Lift Coupling**: Sucker Rod Pumps (SRPs) operating under cooling heavy oil experience:
   - **Severe Rod Floating** on downstrokes due to high viscous shear drag opposing downward buoyant rod weight.
   - **Impact Shock / Fluid Pound** as inflow decreases and pump barrel fillage drops below 65%.
   - **Fatigue / Overload Failure** when Peak Polished Rod Loads (PPRL) breach safe working stress limits.
   - **High Energy Consumption & Suboptimal Steam-to-Oil Ratio (SOR)**.

**PETRO-TWIN** is a research-grade, physics-informed digital twin platform that couples thermal reservoir dynamics, wellbore hydraulics, sucker rod mechanics, and surface energy balances with multi-objective optimization (NSGA-II) and explainable AI (SHAP) to recommend safe, cost-effective operating configurations for petroleum production engineers.

---

## 2. Coupled 4-Tier Architecture

```
                               ┌─────────────────────────────────────────┐
                               │       SURFACE PUMPING UNIT & TANK       │
                               │  - Oil/Water Balance & Separator        │
                               │  - Motor Power (kW) & kWh/bbl           │
                               │  - Steam-to-Oil Ratio (SOR)             │
                               └────────────────────▲────────────────────┘
                                                    │
                               ┌────────────────────┴────────────────────┐
                               │      SUCKER ROD PUMP (SRP) LIFT         │
                               │  - Kinematic Stroke & SPM Motion        │
                               │  - Peak & Min Polished Rod Load         │
                               │  - Heavy-Oil Viscous Drag & Rod Float   │
                               │  - Volumetric Fillage & Fluid Pound     │
                               └────────────────────▲────────────────────┘
                                                    │
                               ┌────────────────────┴────────────────────┐
                               │           WELLBORE COLUMN               │
                               │  - Ramey Heat Loss to Overburden        │
                               │  - Bottomhole-to-Wellhead Temp Profile  │
                               │  - Multiphase Frictional Pressure Loss  │
                               └────────────────────▲────────────────────┘
                                                    │
                               ┌────────────────────┴────────────────────┐
                               │       RESERVOIR HEATED MATRIX           │
                               │  - Boberg-Lantz Thermal Decay           │
                               │  - ASTM D341 Walther Viscosity Model    │
                               │  - Vogel's Heavy-Oil Inflow Potential   │
                               └─────────────────────────────────────────┘
```

---

## 3. Mathematical Formulations & Engineering Models

### A. Boberg-Lantz Reservoir Heat Decay Model
$$\bar{T}_r(t) = T_{init} + (T_{peak} - T_{init}) \cdot \exp\left(-\frac{t}{\tau_{decay}}\right)$$
Where $T_{peak}$ is calculated from injected steam mass enthalpy $H_{steam}$ and volumetric rock heat capacity $M_{res} C_{res}$, and $\tau_{decay}$ represents conductive cooling into the surrounding formation.

### B. Heavy-Oil ASTM D341 / Walther Viscosity-Temperature Model
$$\log_{10}(\log_{10}(\mu + 0.7)) = A - B \cdot \log_{10}(T + 273.15)$$

### C. Sucker Rod Dynamic Polished Rod Loads & Viscous Shear Drag
- **Peak Polished Rod Load (PPRL) on Upstroke**:
  $$\text{PPRL} = W_{fluid} + W_{rod} \cdot \left(1 + \frac{S_{length} \cdot \text{SPM}^2}{70500}\right) + F_{viscous\_drag}(\mu)$$
- **Minimum Polished Rod Load (MPRL) on Downstroke**:
  $$\text{MPRL} = W_{rod,buoyant} \cdot \left(1 - \frac{S_{length} \cdot \text{SPM}^2}{70500}\right) - F_{viscous\_drag}(\mu)$$
- **Rod Floating Condition**:
  $$\text{If } \text{MPRL} \le 2000\text{ lbs} \implies \text{Severe Rod Floating (Compressive Buckling Risk)}$$

### D. Multi-Objective Optimization Formulation (NSGA-II)
$$\min_{\mathbf{x}} \quad \left[ -Q_{oil}(\mathbf{x}), \quad \text{SOR}(\mathbf{x}), \quad E_{spec}(\mathbf{x}), \quad \mathcal{R}_{mech}(\mathbf{x}) \right]$$
**Subject to**:
1. $\text{PPRL} \le 0.90 \times \text{Rod Rating}$
2. $\text{MPRL} \ge 0.10 \times W_{rod}$ (No rod float)
3. $\text{Pump Fillage } \eta_{vol} \ge 60\%$ (No fluid pound)
4. $P_{steam} \le 80.0\text{ bar}$

---

## 4. Key Application Features

1. **Overview Dashboard**: Real-time KPIs (Oil Rate, Temperatures, Viscosity, PPRL, MPRL, SOR, Specific Energy), synchronized multi-parameter time-series chart.
2. **Coupled Digital Twin**: 4-Tier interactive visual schematic with live parameter indicators and heat transfer equations.
3. **CSS Thermal Analysis**: Boberg-Lantz cooling curves, Walther ASTM D341 log-log viscosity curves, thermal efficiency metrics.
4. **SRP Monitoring & Dynamics**: Dynamic load trends, motor power kW, fluid pound fillage tracking, VFD controls.
5. **Dynamometer AI Laboratory**: HTML5 Canvas rendering of Surface vs Downhole Pump cards, testing of 6 failure modes (`NORMAL_OPERATION`, `FLUID_POUND`, `GAS_INTERFERENCE`, `ROD_FLOATING`, `WORN_TRAVELING_VALVE`, `MECHANICAL_OVERLOAD`), and automated ML classification.
6. **AI Prediction & Explainability**: Chronological holdout evaluation, 90% quantile confidence bounds, SHAP-style waterfall attributions.
7. **NSGA-II Multi-Objective Optimization**: Interactive 4D Pareto frontier scatter plot, objective trade-off matrix, utility scoring.
8. **What-If Simulator**: Real-time parameter sliders (Steam Volume, Pressure, Soak Days, Stroke Length, SPM) running instant coupled physics simulations with baseline vs scenario comparison.
9. **Safety Gate & Operator Approval**: Human-in-the-loop recommendation review with persistent operator audit logging (`APPROVE`, `REJECT`, `INSPECT`).
10. **Risk Alerts & Model QA**: Mechanical hazard tracking, model evaluation metrics (MAE, RMSE, R²), and one-click continuous model recalibration.

---

## 5. Technology Stack

- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, WebSockets.
- **Physics Engine**: NumPy, SciPy, Boberg-Lantz, Gibbs Wave Damped Model, ASTM D341 Walther, API RP 11L.
- **Machine Learning**: Scikit-Learn (Gradient Boosting Regressors, Random Forest Morphological Classifiers), PyTorch, Quantile Loss.
- **Optimizer**: Constrained NSGA-II Multi-Objective Genetic Algorithm with Pareto Non-Dominated Sorting.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, HTML5 Canvas.
- **Containerization**: Docker, Docker Compose, Nginx.

---

## 6. Project Directory Structure

```
SIH_Proj_2/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── wells.py
│   │   │   │   ├── telemetry.py
│   │   │   │   ├── css.py
│   │   │   │   ├── srp.py
│   │   │   │   ├── dynamometer.py
│   │   │   │   ├── predictions.py
│   │   │   │   ├── simulation.py
│   │   │   │   ├── optimization.py
│   │   │   │   ├── recommendations.py
│   │   │   │   ├── risks.py
│   │   │   │   └── models_registry.py
│   │   │   └── api_router.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── models.py
│   │   │   └── session.py
│   │   ├── physics/
│   │   │   ├── reservoir_thermal.py
│   │   │   ├── wellbore_flow.py
│   │   │   ├── srp_mechanics.py
│   │   │   ├── dynamometer.py
│   │   │   └── coupled_twin.py
│   │   ├── ml/
│   │   │   ├── dataset_generator.py
│   │   │   ├── thermal_predictor.py
│   │   │   ├── production_predictor.py
│   │   │   ├── dyno_classifier.py
│   │   │   └── explainability.py
│   │   ├── optimizer/
│   │   │   ├── nsga2_engine.py
│   │   │   └── safety_gate.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_physics_and_ai.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── seed_data.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/ (Navbar, Sidebar, MetricCard)
│   │   │   ├── digital_twin/ (CoupledVisualizer)
│   │   │   └── dynamometer/ (DynoCardCanvas)
│   │   ├── pages/ (10 Interactive Application Views)
│   │   ├── services/ (api.ts)
│   │   ├── types/ (index.ts)
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## 7. Local Installation & Execution Guide

### Option A: Local Development (FastAPI + Vite)

#### 1. Start the Backend:
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 seed_data.py
uvicorn app.main:app --reload --port 8000
```
Backend API and Interactive Swagger documentation will be available at:
- **API Base**: `http://localhost:8000`
- **Swagger UI**: `http://localhost:8000/docs`

#### 2. Start the Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Option B: Docker Compose (Full Stack Single-Command)

```bash
docker-compose up --build
```
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`

---

## 8. SIH Demonstration & Evaluation Walkthrough

1. **Sense (Overview & Coupled Twin)**:
   - Select Well **BW-01 (Baghewala Heavy Oil)**.
   - Observe live coupled telemetry across Reservoir ($148.5^\circ\text{C}$), Wellbore ($82.4^\circ\text{C}$), SRP ($21,500\text{ lbs}$ PPRL, $88\%$ fillage), and Surface ($180\text{ bpd}$, $2.65\text{ SOR}$).
2. **Model & Predict (AI & SHAP)**:
   - Navigate to **AI Prediction & SHAP**. Adjust the Cycle Day slider to see the thermal decay cone and SHAP feature attribution explaining heat enthalpy dissipation.
3. **Diagnose (Dynamometer Lab)**:
   - Navigate to **Dynamometer AI Cards**. Switch between **Normal Operation**, **Fluid Pound**, and **Rod Floating**.
   - Inspect the real-time Canvas rendering and the AI classifier displaying $>98\%$ diagnostic confidence.
4. **Optimize (NSGA-II)**:
   - Navigate to **NSGA-II Optimization**. Execute an evolutionary Pareto search.
   - Click on non-dominated candidates to inspect trade-offs between Cumulative Oil, SOR, and Specific Energy.
5. **Simulate (What-If Lab)**:
   - Click **"Load into What-If Simulator"** to test the chosen configuration.
   - Observe delta gains ($+34.2\text{ bpd}$, $-16.5\%\text{ energy saving}$) and verify Safety Gate clearance.
6. **Approve & Learn (Recommendations & Recalibration)**:
   - Review the engineering rationale in **Safety & Operator Action** and record an approval signature.
   - In **Risk Alerts & Model QA**, click **"Trigger Continuous Recalibration"** to retrain the ML models on the updated operating record.
