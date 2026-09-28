import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from app.ml.dataset_generator import HeavyOilDatasetGenerator

class ProductionPredictorModel:
    """
    Predicts oil production rate (bpd) and cumulative production
    from coupled thermal and SRP operational inputs.
    """

    def __init__(self):
        self.model_oil = GradientBoostingRegressor(n_estimators=120, learning_rate=0.07, max_depth=4, random_state=42)
        self.model_oil_lower = GradientBoostingRegressor(loss="quantile", alpha=0.05, n_estimators=80, max_depth=3, random_state=42)
        self.model_oil_upper = GradientBoostingRegressor(loss="quantile", alpha=0.95, n_estimators=80, max_depth=3, random_state=42)
        self.feature_names = [
            "reservoir_temp_c", "oil_viscosity_cp", "stroke_length_in", 
            "spm", "cycle_day", "steam_volume_tonnes"
        ]
        self.is_trained = False
        self.metrics = {}
        self.feature_importances_ = {}

    def train_baseline(self):
        gen = HeavyOilDatasetGenerator()
        df = gen.generate_well_dataset("BW-01", num_cycles=5, days_per_cycle=80)
        
        X = df[self.feature_names].values
        y_oil = df["oil_rate_bpd"].values
        
        # Chronological train-test split
        train_mask = df["cycle_number"] <= 4
        X_train, y_train = X[train_mask], y_oil[train_mask]
        X_test, y_test = X[~train_mask], y_oil[~train_mask]
        
        self.model_oil.fit(X_train, y_train)
        self.model_oil_lower.fit(X_train, y_train)
        self.model_oil_upper.fit(X_train, y_train)
        
        y_pred = self.model_oil.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        
        importances = self.model_oil.feature_importances_
        self.feature_importances_ = {
            name: round(float(imp), 4) for name, imp in zip(self.feature_names, importances)
        }
        
        self.is_trained = True
        self.metrics = {
            "mae_bpd": round(mae, 2),
            "rmse_bpd": round(rmse, 2),
            "r2_score": round(r2, 4),
            "feature_importances": self.feature_importances_
        }
        return self.metrics

    def predict(
        self,
        reservoir_temp_c: float,
        oil_viscosity_cp: float,
        stroke_length_in: float,
        spm: float,
        cycle_day: float,
        steam_volume_tonnes: float = 2200.0
    ) -> dict:
        if not self.is_trained:
            self.train_baseline()
            
        x = np.array([[reservoir_temp_c, oil_viscosity_cp, stroke_length_in, spm, cycle_day, steam_volume_tonnes]])
        pred_oil = float(max(5.0, self.model_oil.predict(x)[0]))
        pred_lower = float(max(0.0, self.model_oil_lower.predict(x)[0]))
        pred_upper = float(max(pred_lower, self.model_oil_upper.predict(x)[0]))
        
        return {
            "predicted_oil_rate_bpd": round(pred_oil, 2),
            "oil_rate_lower_bound_bpd": round(pred_lower, 2),
            "oil_rate_upper_bound_bpd": round(pred_upper, 2),
            "confidence_margin_bpd": round((pred_upper - pred_lower) / 2.0, 2)
        }
