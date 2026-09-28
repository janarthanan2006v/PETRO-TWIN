from fastapi import APIRouter, Body
from app.optimizer.nsga2_engine import MultiObjectiveOptimizer

router = APIRouter()
optimizer = MultiObjectiveOptimizer()

@router.post("/run-nsga2")
def run_optimization(
    population_size: int = Body(20),
    generations: int = Body(4)
):
    """
    Executes Constrained NSGA-II Multi-Objective Optimization for CSS & SRP parameters.
    Returns Pareto front solutions, objective trade-offs, and recommended candidate.
    """
    results = optimizer.run_pareto_optimization(
        population_size=population_size,
        generations=generations
    )
    return results
