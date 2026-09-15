"""Independent analytics service. Node owns transactions; this service only predicts."""
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List

app = FastAPI(title='PharmaPulse Intelligence', version='0.1.0')
class DemandInput(BaseModel):
    medicine: str
    current_stock: int = Field(ge=0)
    minimum_stock: int = Field(ge=0)
    lead_time_days: int = Field(default=7, ge=1)
    daily_sales: List[float] = []
@app.get('/health')
def health(): return {'status':'ok','service':'pharmacy-ai'}
@app.post('/forecast/demand')
def demand(x: DemandInput):
    # Deterministic baseline; replace with trained model without changing the API.
    avg = sum(x.daily_sales) / len(x.daily_sales) if x.daily_sales else 0
    predicted = round(avg * 30)
    safety = round(avg * x.lead_time_days + x.minimum_stock)
    return {'medicine':x.medicine,'predicted_30_day_demand':predicted,'recommended_purchase':max(0,predicted+safety-x.current_stock),'model':'moving-average-baseline'}
