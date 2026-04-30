from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

app = FastAPI(title="ESG SME Platform Qatar")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.get("/")
@app.get("/api")
def root():
    return {"message": "ESG SME Platform API - Qatar", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

# Auth endpoints
@app.post("/api/auth/login")
async def login(email: str, password: str):
    return {"access_token": "test_token_123", "token_type": "bearer"}

@app.post("/api/auth/signup")
async def signup(email: str, password: str, company_name: str, sector: str):
    return {"id": 1, "email": email, "company_name": company_name, "sector": sector}

# ESG Data endpoints
@app.get("/api/esg/data/{year}")
async def get_esg_data(year: int):
    return {
        "reporting_year": year,
        "scope1_emissions": 125.5,
        "scope2_emissions": 200.3,
        "scope3_emissions": 300.0,
        "total_electricity_kwh": 50000,
        "renewable_energy_percentage": 25,
        "total_water_consumption": 1000,
        "total_waste_generated": 50,
        "waste_recycled_percentage": 45,
        "total_employees": 150,
        "employee_turnover_rate": 12.5,
        "ltifr": 2.5,
        "safety_training_completion": 85,
        "women_in_board_percentage": 30,
        "qatarization_percentage": 20,
        "has_antibribery_policy": True,
        "supplier_esg_screened": 75,
        "local_procurement_percentage": 60,
        "data_breaches_count": 0
    }

@app.post("/api/esg/data")
async def save_esg_data(data: dict):
    return {"message": "ESG data saved successfully", "id": 1, **data}

@app.get("/api/esg/score")
async def get_esg_score():
    return {
        "score": 78.5,
        "level": "Silver",
        "environment": 75,
        "social": 82,
        "governance": 78
    }

@app.get("/api/esg/history")
async def get_esg_history():
    return [
        {"reporting_year": 2025, "scope1_emissions": 125.5, "total_employees": 150},
        {"reporting_year": 2024, "scope1_emissions": 150.2, "total_employees": 140}
    ]

# Report endpoints
@app.post("/api/reports/generate/{year}")
async def generate_report(year: int, report_type: str = "basic"):
    return {
        "message": "Report generated",
        "filename": f"esg_report_{year}.pdf",
        "download_url": f"/api/reports/download/1"
    }

@app.get("/api/reports/history")
async def get_report_history():
    return [
        {"id": 1, "report_type": "basic", "created_at": "2025-01-15T10:30:00", "download_url": "/api/reports/download/1"},
        {"id": 2, "report_type": "advanced", "created_at": "2025-01-10T14:20:00", "download_url": "/api/reports/download/2"}
    ]

@app.get("/api/reports/download/{report_id}")
async def download_report(report_id: int):
    # Return a simple PDF (in production, generate actual PDF)
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(f"Sample PDF content for report {report_id}", media_type="application/pdf")

# Materiality endpoints
@app.post("/api/materiality/assess/{year}")
async def assess_materiality(year: int):
    return {
        "env_score": 65,
        "social_score": 70,
        "gov_score": 60,
        "priority_topics": ["GHG Emissions", "Energy Management", "Health & Safety", "Corporate Governance"],
        "recommendations": "Focus on reducing energy consumption and increasing diversity in leadership"
    }

# Serve static files (HTML, CSS, JS)
@app.get("/{file_path:path}")
async def serve_static(file_path: str):
    """Serve all static files from root directory"""
    # If file exists, serve it
    if os.path.exists(file_path):
        # Set correct content type for different file types
        if file_path.endswith('.html'):
            return FileResponse(file_path, media_type="text/html")
        elif file_path.endswith('.css'):
            return FileResponse(file_path, media_type="text/css")
        elif file_path.endswith('.js'):
            return FileResponse(file_path, media_type="application/javascript")
        else:
            return FileResponse(file_path)
    
    # Default to index.html
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    
    return {"error": "File not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
