import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from app.ml.dataset_generator import HeavyOilDatasetGenerator

class ThermalPredictorModel:
    """
    Predicts reservoir thermal decline and viscosity progression.
    Features: steam_volume, steam_pressure, soak_days, cycle_day, cycle_number.
    Target: reservoir_temp_c, oil_viscosity_cp.
    """

    def __init__(self):
        self.model_temp = GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
        self.model_temp_lower = GradientBoostingRegressor(loss="quantile", alpha=0.05, n_estimators=80, max_depth=3, random_state=42)
        self.model_temp_upper = GradientBoostingRegressor(loss="quantile", alpha=0.95, n_estimators=80, max_depth=3, random_state=42)
        self.is_trained = False
        self.metrics = {}

    def train_baseline(self):
        gen = HeavyOilDatasetGenerator()
        df = gen.generate_well_dataset("BW-01", num_cycles=5, days_per_cycle=80)
        
        feature_cols = ["steam_volume_tonnes", "steam_pressure_bar", "soak_days", "cycle_day", "cycle_number"]
        X = df[feature_cols].values
        y_temp = df["reservoir_temp_c"].values
        
        # Chronological train-test split (first 4 cycles train, last cycle test)
        train_mask = df["cycle_number"] <= 4
        X_train, y_train = X[train_mask], y_temp[train_mask]
        X_test, y_test = X[~train_mask], y_temp[~train_mask]
        
        self.model_temp.fit(X_train, y_train)
        self.model_temp_lower.fit(X_train, y_train)
        self.model_temp_upper.fit(X_train, y_train)
        
        y_pred = self.model_temp.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        
        self.is_trained = True
        self.metrics = {
            "mae_c": round(mae, 2),
            "rmse_c": round(rmse, 2),
            "r2_score": round(r2, 4),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test))
        }
        return self.metrics

    def predict(
        self,
        steam_volume_tonnes: float,
        steam_pressure_bar: float,
        soak_days: float,
        cycle_day: float,
        cycle_number: int = 1
    ) -> dict:
        if not self.is_trained:
            self.train_baseline()
            
        x = np.array([[steam_volume_tonnes, steam_pressure_bar, soak_days, cycle_day, cycle_number]])
        pred_temp = float(self.model_temp.predict(x)[0])
        pred_lower = float(self.model_temp_lower.predict(x)[0])
        pred_upper = float(self.model_temp_upper.predict(x)[0])
        
        # Derived viscosity approximation
        # log10(log10(v + 0.7)) = 9.85 - 3.65 * log10(T + 273.15)
        t_k = pred_temp + 273.15
        val = 9.85 - 3.65 * np.log10(t_k)
        visc = float(10 ** (10 ** val) - 0.7)
        visc = max(10.0, min(25000.0, visc))
        
        return {
            "predicted_temp_c": round(pred_temp, 2),
            "temp_lower_bound_c": round(pred_lower, 2),
            "temp_upper_bound_c": round(pred_upper, 2),
            "confidence_margin_c": round((pred_upper - pred_lower) / 2.0, 2),
            "estimated_viscosity_cp": round(visc, 2)
        }
