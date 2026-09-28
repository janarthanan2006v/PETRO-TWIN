import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from app.physics.dynamometer import DynamometerCardGenerator

class DynamometerCardClassifier:
    """
    Classifies surface and downhole SRP dynamometer cards into 6 diagnostic failure classes:
    - NORMAL_OPERATION
    - FLUID_POUND
    - GAS_INTERFERENCE
    - ROD_FLOATING
    - WORN_TRAVELING_VALVE
    - MECHANICAL_OVERLOAD
    """

    CLASSES = [
        "NORMAL_OPERATION",
        "FLUID_POUND",
        "GAS_INTERFERENCE",
        "ROD_FLOATING",
        "WORN_TRAVELING_VALVE",
        "MECHANICAL_OVERLOAD"
    ]

    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.generator = DynamometerCardGenerator(num_points=100)
        self.is_trained = False
        self.metrics = {}

    def _extract_features(self, card_dict: dict) -> list[float]:
        """
        Extracts invariant morphological and physical features from card coordinates.
        """
        pos = np.array(card_dict["surface_position_in"])
        load = np.array(card_dict["surface_load_lbs"])
        p_load = np.array(card_dict["pump_load_lbs"])
        
        stroke = float(np.max(pos) - np.min(pos))
        max_load = float(np.max(load))
        min_load = float(np.min(load))
        delta_load = max(100.0, max_load - min_load)
        
        # Approximate card work area: integral y dx
        card_area = float(np.trapz(load[:len(load)//2], pos[:len(pos)//2]) - np.trapz(load[len(load)//2:], pos[len(pos)//2:]))
        
        # Mid-downstroke load drop ratio
        downstroke_mid_idx = int(len(load) * 0.75)
        downstroke_mid_load = float(load[downstroke_mid_idx])
        downstroke_ratio = downstroke_mid_load / max(1.0, min_load + delta_load * 0.5)
        
        # Upstroke delayed load ratio
        upstroke_quarter_idx = int(len(load) * 0.25)
        upstroke_quarter_load = float(load[upstroke_quarter_idx])
        upstroke_lag_ratio = upstroke_quarter_load / max(1.0, max_load)
        
        # Minimum load relative to buoyant weight threshold
        min_load_ratio = min_load / max(100.0, max_load)
        
        # Pump load variation
        p_max = float(np.max(p_load))
        p_min = float(np.min(p_load))
        
        # Downstroke slope / curvature
        downstroke_slope = (float(load[int(len(load) * 0.8)]) - float(load[int(len(load) * 0.55)])) / max(1.0, stroke)
        
        return [
            stroke,
            max_load,
            min_load,
            delta_load,
            card_area,
            downstroke_ratio,
            upstroke_lag_ratio,
            min_load_ratio,
            p_max,
            p_min,
            downstroke_slope
        ]

    def train_baseline(self):
        X, y = [], []
        
        for cls_name in self.CLASSES:
            for stroke in [86.0, 100.0, 120.0, 144.0]:
                for spm in [4.5, 6.0, 7.5, 9.0]:
                    for rep in range(12):
                        # Tailor class-specific physical parameter distributions
                        if cls_name == "NORMAL_OPERATION":
                            pprl = 21000.0 + (stroke * 20.0) + np.random.normal(0, 200)
                            mprl = 6500.0 + np.random.normal(0, 150)
                            visc = float(np.random.uniform(40.0, 180.0))
                            fillage = float(np.random.uniform(80.0, 95.0))
                        elif cls_name == "FLUID_POUND":
                            pprl = 22000.0 + np.random.normal(0, 250)
                            mprl = 5200.0 + np.random.normal(0, 200)
                            visc = float(np.random.uniform(50.0, 250.0))
                            fillage = float(np.random.uniform(35.0, 58.0))
                        elif cls_name == "GAS_INTERFERENCE":
                            pprl = 20500.0 + np.random.normal(0, 200)
                            mprl = 5800.0 + np.random.normal(0, 150)
                            visc = float(np.random.uniform(40.0, 150.0))
                            fillage = float(np.random.uniform(68.0, 82.0))
                        elif cls_name == "ROD_FLOATING":
                            pprl = 19000.0 + np.random.normal(0, 300)
                            mprl = float(np.random.uniform(400.0, 1400.0))  # severely depressed downstroke load
                            visc = float(np.random.uniform(1400.0, 3800.0))  # cold heavy oil
                            fillage = float(np.random.uniform(75.0, 90.0))
                        elif cls_name == "WORN_TRAVELING_VALVE":
                            pprl = 17500.0 + np.random.normal(0, 250)
                            mprl = 6200.0 + np.random.normal(0, 150)
                            visc = float(np.random.uniform(60.0, 200.0))
                            fillage = float(np.random.uniform(78.0, 90.0))
                        elif cls_name == "MECHANICAL_OVERLOAD":
                            pprl = float(np.random.uniform(27500.0, 31000.0))  # breaches rod rating
                            mprl = 7200.0 + np.random.normal(0, 200)
                            visc = float(np.random.uniform(80.0, 300.0))
                            fillage = float(np.random.uniform(80.0, 95.0))

                        card = self.generator.generate_card(
                            stroke_length_in=stroke,
                            spm=spm,
                            pprl_lbs=pprl,
                            mprl_lbs=mprl,
                            fluid_viscosity_cp=visc,
                            fillage_pct=fillage,
                            fault_type=cls_name
                        )
                        feats = self._extract_features(card)
                        X.append(feats)
                        y.append(cls_name)

        X = np.array(X)
        y = np.array(y)
        
        # Shuffle & train
        indices = np.arange(len(X))
        np.random.seed(42)
        np.random.shuffle(indices)
        train_len = int(0.8 * len(X))
        
        train_idx, test_idx = indices[:train_len], indices[train_len:]
        self.model.fit(X[train_idx], y[train_idx])
        
        y_pred = self.model.predict(X[test_idx])
        acc = accuracy_score(y[test_idx], y_pred)
        
        self.is_trained = True
        self.metrics = {
            "accuracy": round(float(acc), 4),
            "num_classes": len(self.CLASSES),
            "classes": self.CLASSES,
            "training_samples": len(train_idx),
            "test_samples": len(test_idx)
        }
        return self.metrics

    def classify_card(self, card_dict: dict) -> dict:
        if not self.is_trained:
            self.train_baseline()
            
        feats = np.array([self._extract_features(card_dict)])
        pred_label = str(self.model.predict(feats)[0])
        probs = self.model.predict_proba(feats)[0]
        
        class_probabilities = {
            cls_name: round(float(p), 4) for cls_name, p in zip(self.model.classes_, probs)
        }
        confidence = float(max(probs))
        
        descriptions = {
            "NORMAL_OPERATION": "Pump dynamometer card exhibits full volumetric displacement with healthy valve seating and nominal rod loading.",
            "FLUID_POUND": "Incomplete pump fillage detected. Traveling valve strikes fluid surface abruptly midway through downstroke, causing impact shock loading.",
            "GAS_INTERFERENCE": "Free gas entering pump barrel causes compression cushion on downstroke, delaying traveling valve opening and reducing displacement.",
            "ROD_FLOATING": "Severe heavy-oil viscous drag on downstroke exceeds buoyant rod weight, resulting in compressive rod stress and floating tendency.",
            "WORN_TRAVELING_VALVE": "Fluid slippage through worn traveling valve ball and seat results in delayed upstroke load transfer and degraded volumetric efficiency.",
            "MECHANICAL_OVERLOAD": "Polished rod load exceeds 90% of rated yield strength, presenting severe rod fatigue and surface unit overload risks."
        }
        
        return {
            "predicted_fault": pred_label,
            "confidence": round(confidence, 2),
            "class_probabilities": class_probabilities,
            "description": descriptions.get(pred_label, "Anomaly detected in pump card profile."),
            "severity": "CRITICAL" if pred_label in ["ROD_FLOATING", "MECHANICAL_OVERLOAD"] else ("HIGH" if pred_label == "FLUID_POUND" else "NORMAL")
        }
